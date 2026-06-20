const express = require('express');
const { applyRuntimeUpdates, getRuntimePayload } = require('../config/models');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getRuntimePayload(req.app.locals.runtime));
});

router.post('/', (req, res) => {
  try {
    const updates = req.body || {};
    const hasUpdate = ['text', 'vision', 'image', 'personality', 'searchProvider'].some(
      (key) => updates[key] !== undefined
    );

    if (!hasUpdate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Provide at least one of text, vision, image, personality, or searchProvider',
      });
    }

    req.app.locals.runtime = applyRuntimeUpdates(req.app.locals.runtime, updates);
    console.log('[RUNTIME] updated', req.app.locals.runtime);
    res.json(getRuntimePayload(req.app.locals.runtime));
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

module.exports = router;
