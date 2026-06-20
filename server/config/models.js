const { DEFAULT_PERSONALITY, listPersonalities, validatePersonality } = require('./personalities');

const MODEL_CATALOG = {
  text: [
    { provider: 'openai', model: 'gpt-4o-mini', label: 'GPT-4o Mini', supportsTools: true },
    { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o', supportsTools: true },
    { provider: 'openai', model: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', supportsTools: true },
    { provider: 'openai', model: 'gpt-4.1', label: 'GPT-4.1', supportsTools: true },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', supportsTools: true },
    { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', supportsTools: true },
    { provider: 'xai', model: 'grok-3-mini', label: 'Grok 3 Mini', supportsTools: true },
    { provider: 'xai', model: 'grok-3', label: 'Grok 3', supportsTools: true },
    { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', supportsTools: true },
    { provider: 'groq', model: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', supportsTools: true },
  ],
  vision: [
    { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o Vision' },
    { provider: 'openai', model: 'gpt-4o-mini', label: 'GPT-4o Mini Vision' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 Vision' },
    { provider: 'xai', model: 'grok-2-vision-1212', label: 'Grok 2 Vision' },
  ],
  image: [
    { provider: 'openai', model: 'gpt-image-1', label: 'GPT Image 1' },
    { provider: 'openai', model: 'gpt-image-1-mini', label: 'GPT Image 1 Mini' },
    { provider: 'openai', model: 'gpt-image-1.5', label: 'GPT Image 1.5' },
  ],
};

function slotKey(slot) {
  return `${slot.provider}:${slot.model}`;
}

function parseSlotKey(key) {
  const idx = key.indexOf(':');
  if (idx === -1) {
    throw new Error(`Invalid model key "${key}". Expected provider:model`);
  }
  return {
    provider: key.slice(0, idx),
    model: key.slice(idx + 1),
  };
}

function getConfiguredProviders() {
  return {
    openai: !!(process.env.OPENAI_API_KEY || process.env.openAPIKey),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    xai: !!process.env.XAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
  };
}

function filterCatalogByProviders(catalog, configured) {
  const filtered = {};
  for (const [category, entries] of Object.entries(catalog)) {
    filtered[category] = entries.filter((entry) => configured[entry.provider]);
  }
  return filtered;
}

function findCatalogEntry(category, provider, model) {
  return MODEL_CATALOG[category]?.find(
    (entry) => entry.provider === provider && entry.model === model
  );
}

function getDefaultRuntime() {
  return {
    text: {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    vision: {
      provider: 'openai',
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
    },
    image: {
      provider: 'openai',
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    },
    personality: DEFAULT_PERSONALITY,
  };
}

function normalizeSlot(value, category) {
  if (!value) return null;
  if (typeof value === 'string') {
    return parseSlotKey(value);
  }
  if (value.provider && value.model) {
    return { provider: value.provider, model: value.model };
  }
  throw new Error(`Invalid ${category} model value`);
}

function validateSlot(category, slot) {
  const configured = getConfiguredProviders();
  if (!configured[slot.provider]) {
    throw new Error(
      `Provider "${slot.provider}" is not configured. Set the corresponding API key in the environment.`
    );
  }
  if (!findCatalogEntry(category, slot.provider, slot.model)) {
    const options = MODEL_CATALOG[category]
      .filter((e) => configured[e.provider])
      .map((e) => slotKey(e))
      .join(', ');
    throw new Error(`Invalid ${category} model "${slotKey(slot)}". Allowed: ${options}`);
  }
}

function applyRuntimeUpdates(current, updates = {}) {
  const next = { ...current };

  if (updates.text !== undefined) {
    const slot = normalizeSlot(updates.text, 'text');
    validateSlot('text', slot);
    next.text = slot;
  }
  if (updates.vision !== undefined) {
    const slot = normalizeSlot(updates.vision, 'vision');
    validateSlot('vision', slot);
    next.vision = slot;
  }
  if (updates.image !== undefined) {
    const slot = normalizeSlot(updates.image, 'image');
    validateSlot('image', slot);
    next.image = slot;
  }
  if (updates.personality !== undefined) {
    validatePersonality(updates.personality);
    next.personality = updates.personality;
  }

  return next;
}

function getRuntimePayload(active) {
  const configured = getConfiguredProviders();
  return {
    active,
    available: filterCatalogByProviders(MODEL_CATALOG, configured),
    personalities: listPersonalities(),
    configuredProviders: configured,
  };
}

module.exports = {
  MODEL_CATALOG,
  getDefaultRuntime,
  applyRuntimeUpdates,
  getRuntimePayload,
  slotKey,
  parseSlotKey,
  getConfiguredProviders,
};
