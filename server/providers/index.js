const openai = require('./openai');
const anthropic = require('./anthropic');
const openaiCompatible = require('./openaiCompatible');
const { getConfiguredProviders } = require('../config/models');

const ADAPTERS = {
  openai,
  anthropic,
  xai: openaiCompatible,
  groq: openaiCompatible,
};

function getAdapter(provider) {
  const configured = getConfiguredProviders();
  if (!configured[provider]) {
    throw new Error(`Provider "${provider}" is not configured (missing API key)`);
  }
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter;
}

async function complete({ provider, model, messages, system, tools, temperature, maxTokens }) {
  const adapter = getAdapter(provider);
  const needsProviderArg = provider === 'xai' || provider === 'groq';
  return adapter.complete({
    ...(needsProviderArg ? { provider } : {}),
    model,
    messages,
    system,
    tools,
    temperature,
    maxTokens,
  });
}

async function completeSimple({ provider, model, messages, system, temperature, maxTokens }) {
  const adapter = getAdapter(provider);
  const needsProviderArg = provider === 'xai' || provider === 'groq';
  return adapter.completeSimple({
    ...(needsProviderArg ? { provider } : {}),
    model,
    messages,
    system,
    temperature,
    maxTokens,
  });
}

async function analyzeImage({ provider, model, prompt, base64Data, mimeType }) {
  const adapter = getAdapter(provider);
  const needsProviderArg = provider === 'xai' || provider === 'groq';
  return adapter.analyzeImage({
    ...(needsProviderArg ? { provider } : {}),
    model,
    prompt,
    base64Data,
    mimeType,
  });
}

module.exports = {
  complete,
  completeSimple,
  analyzeImage,
  getAdapter,
};
