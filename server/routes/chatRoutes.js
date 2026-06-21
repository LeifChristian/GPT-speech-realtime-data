const express = require('express');
const router = express.Router();
const { runChatWithTools, runSimpleChat } = require('../chat/orchestrator');
const { CLASSIFY_SYSTEM_PROMPT } = require('../prompts/classify');
const { DEFAULT_PERSONALITY, PERSONALITIES } = require('../config/personalities');

function resolvePersonalityId(requested, runtimeFallback) {
  const id = requested ?? runtimeFallback ?? DEFAULT_PERSONALITY;
  return PERSONALITIES[id] ? id : DEFAULT_PERSONALITY;
}

const logRequest = (req, res, next) => {
  const start = Date.now();
  const rid = Math.random().toString(36).slice(2, 8);
  req._rid = rid;
  console.log(`[CHAT][${rid}] ${req.method} ${req.originalUrl} ct=${req.headers['content-type'] || ''}`);
  res.on('finish', () => {
    console.log(`[CHAT][${rid}] status=${res.statusCode} dur=${Date.now() - start}ms`);
  });
  next();
};

router.use(logRequest);

router.post('/greeting', async (req, res) => {
  const { text, personality: requestedPersonality } = req.body;
  const runtime = req.app.locals.runtime;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const { provider, model } = runtime.text;
    const personalityId = resolvePersonalityId(requestedPersonality, runtime.personality);
    console.log(
      `[CHAT][${req._rid}] /greeting provider=${provider} model=${model} personality=${personalityId} (requested=${requestedPersonality ?? 'none'}) search=${runtime.searchProvider} preview=${String(text).slice(0, 120)}`
    );

    const reply = await runChatWithTools({
      provider,
      model,
      userMessage: text,
      personalityId,
      searchProvider: runtime.searchProvider,
    });

    console.log(`[CHAT][${req._rid}] /greeting OK len=${(reply || '').length}`);
    res.json({ reply });
  } catch (error) {
    console.error(`[CHAT][${req._rid}] /greeting error`, { message: error.message });
    res.status(500).json({ error: 'Error processing text', message: error.message });
  }
});

router.post('/classify', async (req, res) => {
  const { prompt } = req.body;
  const runtime = req.app.locals.runtime;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const { provider, model } = runtime.text;
    const raw = await runSimpleChat({
      provider,
      model,
      userMessage: prompt,
      system: CLASSIFY_SYSTEM_PROMPT,
      temperature: 0,
      maxTokens: 10,
    });

    const classification = String(raw).trim().toLowerCase();
    console.log(`[CHAT][${req._rid}] /classify -> ${classification}`);

    if (classification === 'image_generation' || classification === 'text') {
      res.json({ type: classification });
    } else {
      res.json({ type: 'text' });
    }
  } catch (error) {
    console.error(`[CHAT][${req._rid}] /classify error:`, error.message);
    res.json({ type: 'text' });
  }
});

module.exports = router;
