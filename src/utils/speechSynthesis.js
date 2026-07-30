/** Max chars per utterance — browsers often truncate long single utterances. */
const MAX_SEGMENT_CHARS = 180;
/** ~15s of speech at rate 1.0 before Chrome's synthesis stall bug kicks in. */
const MAX_SEGMENT_WORDS = 18;

/**
 * Split text into TTS-safe chunks on sentence boundaries, then by word count/length.
 */
export function splitTextForSpeech(input) {
  const text = String(input || '')
    .replace(/^Response:\s*/i, '')
    .trim();
  if (!text) return [];

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const segments = [];
  let chunk = '';

  const pushChunk = () => {
    const trimmed = chunk.trim();
    if (trimmed) segments.push(trimmed);
    chunk = '';
  };

  const wordCount = (value) => value.split(/\s+/).filter(Boolean).length;

  const pushWords = (sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    let part = '';
    words.forEach((word) => {
      const next = part ? `${part} ${word}` : word;
      if (next.length > MAX_SEGMENT_CHARS || wordCount(next) > MAX_SEGMENT_WORDS) {
        if (part) segments.push(part);
        part = word;
      } else {
        part = next;
      }
    });
    if (part) segments.push(part);
  };

  sentences.forEach((rawSentence) => {
    const sentence = rawSentence.trim();
    if (!sentence) return;

    const combined = chunk ? `${chunk} ${sentence}` : sentence;
    if (combined.length > MAX_SEGMENT_CHARS || wordCount(combined) > MAX_SEGMENT_WORDS) {
      if (chunk) pushChunk();
      if (sentence.length > MAX_SEGMENT_CHARS || wordCount(sentence) > MAX_SEGMENT_WORDS) {
        pushWords(sentence);
      } else {
        chunk = sentence;
      }
    } else {
      chunk = combined;
    }
  });

  pushChunk();
  return segments;
}

export function pickPreferredVoice(voices = []) {
  return (
    voices.find(
      (v) => /en/i.test(v.lang) && /(Google US|Samantha|Microsoft|Female|Natural)/i.test(v.name)
    ) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    voices[0] ||
    null
  );
}

/** Chrome/Safari stall long utterances unless synthesis is nudged periodically. */
export function startSpeechKeepAlive(speechSynthesis, intervalMs = 8000) {
  if (!speechSynthesis) return () => {};

  const timer = setInterval(() => {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      try {
        speechSynthesis.pause();
        speechSynthesis.resume();
      } catch {
        // ignore
      }
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
