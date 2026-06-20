const { OpenAI } = require('openai');
const { TOOL_DEFINITIONS } = require('../tools/definitions');

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.openAPIKey;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function toOpenAITools(tools) {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function toOpenAIMessages(messages, system) {
  const out = [];
  if (system) {
    out.push({ role: 'system', content: system });
  }
  for (const msg of messages) {
    if (msg.role === 'tool') {
      out.push({
        role: 'tool',
        tool_call_id: msg.toolCallId,
        content: msg.content,
      });
      continue;
    }
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      out.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments ?? {}),
          },
        })),
      });
      continue;
    }
    out.push({ role: msg.role, content: msg.content });
  }
  return out;
}

function parseOpenAIResponse(message) {
  const toolCalls = (message.tool_calls || []).map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
  }));

  return {
    text: message.content || null,
    toolCalls,
    assistantMessage: {
      role: 'assistant',
      content: message.content || '',
      toolCalls,
    },
  };
}

async function complete({ model, messages, system, tools = TOOL_DEFINITIONS, temperature, maxTokens }) {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI API key is not configured');
  const payload = {
    model,
    messages: toOpenAIMessages(messages, system),
    tools: toOpenAITools(tools),
    tool_choice: 'auto',
  };
  if (temperature !== undefined) payload.temperature = temperature;
  if (maxTokens !== undefined) payload.max_tokens = maxTokens;

  const response = await client.chat.completions.create(payload);
  const message = response.choices[0].message;
  return parseOpenAIResponse(message);
}

async function completeSimple({ model, messages, system, temperature, maxTokens }) {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI API key is not configured');
  const payload = {
    model,
    messages: toOpenAIMessages(messages, system),
  };
  if (temperature !== undefined) payload.temperature = temperature;
  if (maxTokens !== undefined) payload.max_tokens = maxTokens;

  const response = await client.chat.completions.create(payload);
  return {
    text: response.choices[0].message.content || '',
    toolCalls: [],
    assistantMessage: {
      role: 'assistant',
      content: response.choices[0].message.content || '',
      toolCalls: [],
    },
  };
}

async function analyzeImage({ model, prompt, base64Data, mimeType }) {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI API key is not configured');
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'What is in this image?' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content;
}

module.exports = {
  complete,
  completeSimple,
  analyzeImage,
  getOpenAIClient,
};
