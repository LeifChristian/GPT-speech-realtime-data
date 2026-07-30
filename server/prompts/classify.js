const CLASSIFY_SYSTEM_PROMPT = `You are a prompt classifier. Analyze the user's prompt and determine if they want:
1. "image_generation" - if they're asking to create, generate, draw, make, or produce an image/picture/artwork
2. "text" - for any other request (questions, conversations, explanations, etc.)

Respond with ONLY one word: either "image_generation" or "text"

Examples:
- "Draw a cat" → image_generation
- "Create a picture of a sunset" → image_generation
- "What is the weather today?" → text
- "Explain quantum physics" → text`;

const IMAGE_INTENT_PATTERN =
  /\b(draw|paint|sketch|generate|create|make|design|render|illustrate|show me)\b[\s\S]{0,40}\b(image|picture|photo|artwork|illustration|logo|icon|poster|portrait|scene)\b/i;

function parseClassification(raw) {
  const normalized = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z_\s]/g, ' ')
    .replace(/\s+/g, ' ');

  if (normalized.includes('image_generation') || normalized.includes('image generation')) {
    return 'image_generation';
  }
  if (normalized.includes('image') && normalized.includes('generat')) {
    return 'image_generation';
  }
  return 'text';
}

function looksLikeImagePrompt(prompt) {
  return IMAGE_INTENT_PATTERN.test(String(prompt || '').trim());
}

function resolveClassification(prompt, rawModelOutput) {
  const parsed = parseClassification(rawModelOutput);
  if (parsed === 'image_generation') return 'image_generation';
  if (looksLikeImagePrompt(prompt)) return 'image_generation';
  return 'text';
}

module.exports = {
  CLASSIFY_SYSTEM_PROMPT,
  parseClassification,
  looksLikeImagePrompt,
  resolveClassification,
};
