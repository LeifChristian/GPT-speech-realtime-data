const MODEL_CATALOG = {
  text: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast, low-cost chat' },
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Stronger general chat' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Newer efficient chat' },
    { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Newer flagship chat' },
  ],
  vision: [
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Vision analysis' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Faster vision analysis' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Newer vision analysis' },
  ],
  image: [
    { id: 'gpt-image-1', label: 'GPT Image 1', description: 'Default image generation (replaces DALL·E 3)' },
    { id: 'gpt-image-1-mini', label: 'GPT Image 1 Mini', description: 'Faster, cheaper images' },
    { id: 'gpt-image-1.5', label: 'GPT Image 1.5', description: 'Higher quality images' },
  ],
};

const DEFAULTS = {
  textModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  visionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
  imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
};

const allowedIds = {
  text: new Set(MODEL_CATALOG.text.map((m) => m.id)),
  vision: new Set(MODEL_CATALOG.vision.map((m) => m.id)),
  image: new Set(MODEL_CATALOG.image.map((m) => m.id)),
};

function getDefaultModels() {
  return { ...DEFAULTS };
}

function validateModel(category, modelId) {
  const allowed = allowedIds[category];
  if (!allowed || !allowed.has(modelId)) {
    const options = MODEL_CATALOG[category].map((m) => m.id).join(', ');
    throw new Error(`Invalid ${category} model "${modelId}". Allowed: ${options}`);
  }
}

function applyModelUpdates(current, updates = {}) {
  const next = { ...current };

  if (updates.textModel !== undefined) {
    validateModel('text', updates.textModel);
    next.textModel = updates.textModel;
  }
  if (updates.visionModel !== undefined) {
    validateModel('vision', updates.visionModel);
    next.visionModel = updates.visionModel;
  }
  if (updates.imageModel !== undefined) {
    validateModel('image', updates.imageModel);
    next.imageModel = updates.imageModel;
  }

  return next;
}

function getModelsPayload(active) {
  return {
    active,
    available: MODEL_CATALOG,
  };
}

module.exports = {
  MODEL_CATALOG,
  getDefaultModels,
  applyModelUpdates,
  getModelsPayload,
};
