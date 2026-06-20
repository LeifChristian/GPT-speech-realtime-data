const { OpenAI } = require('openai');

const PROVIDER_BASE_URLS = {
  xai: 'https://api.x.ai/v1',
  groq: 'https://api.groq.com/openai/v1',
};

function getClient(provider) {
  const baseURL = PROVIDER_BASE_URLS[provider];
  if (!baseURL) {
    throw new Error(`Unknown OpenAI-compatible provider: ${provider}`);
  }

  const apiKeyEnv = {
    xai: process.env.XAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
  };

  const apiKey = apiKeyEnv[provider];
  if (!apiKey) {
    throw new Error(`Missing API key for provider "${provider}"`);
  }

  return new OpenAI({ apiKey, baseURL });
}

async function complete({ provider, model, messages, system, tools, temperature, maxTokens }) {
  const client = getClient(provider);
  const payload = {
    model,
    messages: buildMessages(messages, system),
    tools: (tools || []).map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),
    tool_choice: 'auto',
  };
  if (temperature !== undefined) payload.temperature = temperature;
  if (maxTokens !== undefined) payload.max_tokens = maxTokens;

  const response = await client.chat.completions.create(payload);
  const message = response.choices[0].message;
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

function buildMessages(messages, system) {
  const out = [];
  if (system) out.push({ role: 'system', content: system });
  for (const msg of messages) {
    if (msg.role === 'tool') {
      out.push({ role: 'tool', tool_call_id: msg.toolCallId, content: msg.content });
      continue;
    }
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      out.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments ?? {}) },
        })),
      });
      continue;
    }
    out.push({ role: msg.role, content: msg.content });
  }
  return out;
}

async function completeSimple({ provider, model, messages, system, temperature, maxTokens }) {
  const client = getClient(provider);
  const payload = {
    model,
    messages: buildMessages(messages, system),
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

async function analyzeImage({ provider, model, prompt, base64Data, mimeType }) {
  const client = getClient(provider);
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'What is in this image?' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
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
};
