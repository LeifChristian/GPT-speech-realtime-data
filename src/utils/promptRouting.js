import { apiUrl } from './api';

export async function classifyUserPrompt(prompt) {
  try {
    const response = await fetch(apiUrl('chat/classify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) return 'text';
    const data = await response.json();
    return data.type === 'image_generation' ? 'image_generation' : 'text';
  } catch (error) {
    console.error('Classification error:', error);
    return 'text';
  }
}

export async function generateImageFromPrompt(prompt) {
  const response = await fetch(apiUrl('image/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error('Image generation failed');
  }
  return response.json();
}
