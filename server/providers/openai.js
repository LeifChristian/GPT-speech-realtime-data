const { OpenAI } = require('openai');
const { TOOL_DEFINITIONS } = require('../tools/definitions');
const { findCatalogEntry } = require('../config/models');

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.openAPIKey;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function usesResponsesApi(model) {
  const entry = findCatalogEntry('text', 'openai', model);
  return entry?.api === 'responses';
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

function toResponsesTools(tools) {
  return tools.map((tool) => ({
    type: 'function',
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: false,
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

function buildResponsesInput(messages) {
  const input = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      input.push({ role: 'user', content: msg.content });
      continue;
    }

    if (msg.role === 'assistant') {
      if (msg.responsesOutput?.length) {
        input.push(...msg.responsesOutput);
        continue;
      }
      if (msg.content) {
        input.push({
          role: 'assistant',
          content: [{ type: 'output_text', text: msg.content }],
        });
      }
      continue;
    }

    if (msg.role === 'tool') {
      input.push({
        type: 'function_call_output',
        call_id: msg.toolCallId,
        output: msg.content,
      });
    }
  }

  return input;
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

function parseResponsesOutput(response) {
  const output = response.output || [];
  const functionCalls = output.filter((item) => item.type === 'function_call');
  const text = response.output_text || null;

  const toolCalls = functionCalls.map((call) => ({
    id: call.call_id,
    name: call.name,
    arguments: JSON.parse(call.arguments || '{}'),
  }));

  return {
    text,
    toolCalls,
    assistantMessage: {
      role: 'assistant',
      content: text || '',
      toolCalls,
      responsesOutput: output,
    },
  };
}

async function completeViaResponses({
  client,
  model,
  messages,
  system,
  tools = TOOL_DEFINITIONS,
  maxTokens,
}) {
  const payload = {
    model,
    instructions: system || undefined,
    input: buildResponsesInput(messages),
    tools: toResponsesTools(tools),
    tool_choice: 'auto',
    store: false,
  };
  if (maxTokens !== undefined) payload.max_output_tokens = maxTokens;

  const response = await client.responses.create(payload);
  return parseResponsesOutput(response);
}

async function complete({ model, messages, system, tools = TOOL_DEFINITIONS, temperature, maxTokens }) {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI API key is not configured');

  if (usesResponsesApi(model)) {
    console.log(`[OPENAI] Responses API complete model=${model}`);
    return completeViaResponses({ client, model, messages, system, tools, maxTokens });
  }

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

  if (usesResponsesApi(model)) {
    console.log(`[OPENAI] Responses API simple model=${model}`);
    const response = await client.responses.create({
      model,
      instructions: system || undefined,
      input: buildResponsesInput(messages),
      max_output_tokens: maxTokens,
      store: false,
    });

    const text = response.output_text || '';
    return {
      text,
      toolCalls: [],
      assistantMessage: {
        role: 'assistant',
        content: text,
        toolCalls: [],
      },
    };
  }

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
  usesResponsesApi,
};
