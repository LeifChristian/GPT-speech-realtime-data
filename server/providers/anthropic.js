const axios = require('axios');
const { TOOL_DEFINITIONS } = require('../tools/definitions');

const BASE_URL = 'https://api.anthropic.com/v1';

function getHeaders() {
  return {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
}

function toAnthropicTools(tools) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

function toAnthropicMessages(messages) {
  const out = [];
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    if (msg.role === 'tool') {
      out.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.toolCallId,
            content: msg.content,
          },
        ],
      });
      continue;
    }
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      const content = [];
      if (msg.content) {
        content.push({ type: 'text', text: msg.content });
      }
      for (const tc of msg.toolCalls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.arguments ?? {},
        });
      }
      out.push({ role: 'assistant', content });
      continue;
    }
    out.push({ role: msg.role, content: msg.content });
  }
  return out;
}

function parseAnthropicResponse(data) {
  const blocks = data.content || [];
  const textParts = blocks.filter((b) => b.type === 'text').map((b) => b.text);
  const toolCalls = blocks
    .filter((b) => b.type === 'tool_use')
    .map((b) => ({
      id: b.id,
      name: b.name,
      arguments: b.input ?? {},
    }));

  const text = textParts.join('\n').trim() || null;
  return {
    text,
    toolCalls,
    assistantMessage: {
      role: 'assistant',
      content: text || '',
      toolCalls,
    },
  };
}

async function complete({ model, messages, system, tools = TOOL_DEFINITIONS, temperature, maxTokens }) {
  const payload = {
    model,
    max_tokens: maxTokens ?? 4096,
    system,
    messages: toAnthropicMessages(messages),
    tools: toAnthropicTools(tools),
  };
  if (temperature !== undefined) payload.temperature = temperature;

  const { data } = await axios.post(`${BASE_URL}/messages`, payload, {
    headers: getHeaders(),
    timeout: 120000,
  });

  if (data.stop_reason === 'tool_use') {
    const parsed = parseAnthropicResponse(data);
    parsed.text = parsed.text || null;
    return parsed;
  }

  return parseAnthropicResponse(data);
}

async function completeSimple({ model, messages, system, temperature, maxTokens }) {
  const payload = {
    model,
    max_tokens: maxTokens ?? 1024,
    system,
    messages: toAnthropicMessages(messages),
  };
  if (temperature !== undefined) payload.temperature = temperature;

  const { data } = await axios.post(`${BASE_URL}/messages`, payload, {
    headers: getHeaders(),
    timeout: 60000,
  });

  return parseAnthropicResponse(data);
}

async function analyzeImage({ model, prompt, base64Data, mimeType }) {
  const payload = {
    model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: prompt || 'What is in this image?',
          },
        ],
      },
    ],
  };

  const { data } = await axios.post(`${BASE_URL}/messages`, payload, {
    headers: getHeaders(),
    timeout: 120000,
  });

  return parseAnthropicResponse(data).text || '';
}

module.exports = {
  complete,
  completeSimple,
  analyzeImage,
};
