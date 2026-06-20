import { apiUrl } from './api';

export async function transcribeAudio(blob, mimeType = 'audio/webm') {
  const ext = mimeType.includes('mp4') || mimeType.includes('aac') ? 'm4a' : 'webm';
  const form = new FormData();
  form.append('audio', blob, `recording.${ext}`);

  const res = await fetch(apiUrl('/audio/transcribe'), {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let message = `Transcription failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.message) message = data.message;
      else if (data.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = await res.json();
  return String(data.transcript || '').trim();
}

export function getRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}
