const express = require('express');
const OpenAI = require('openai');
const { getOpenAIClient } = require('../providers/openai');

const router = express.Router();

router.post('/transcribe', (req, res, next) => {
  req.app.locals.upload.single('audio')(req, res, (err) => {
    if (err) return next(err);
    handleTranscribe(req, res);
  });
});

async function handleTranscribe(req, res) {
  const client = getOpenAIClient();
  if (!client) {
    return res.status(503).json({ error: 'OpenAI API key is not configured' });
  }

  if (!req.file?.buffer?.length) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const mime = req.file.mimetype || 'audio/webm';
  const ext = mime.includes('mp4') || mime.includes('aac') ? 'm4a' : 'webm';

  try {
    const file = await OpenAI.toFile(req.file.buffer, `recording.${ext}`, { type: mime });
    const model = process.env.WHISPER_MODEL || 'whisper-1';

    const result = await client.audio.transcriptions.create({
      file,
      model,
      language: 'en',
    });

    const transcript = String(result.text || '').trim();
    console.log(`[AUDIO] transcribed ${req.file.size} bytes → ${transcript.length} chars`);
    res.json({ transcript });
  } catch (error) {
    console.error('[AUDIO] transcription failed:', error.message);
    res.status(500).json({ error: 'Transcription failed', message: error.message });
  }
}

module.exports = router;
