const express = require('express');
const { applyModelUpdates, getModelsPayload } = require('../config/models');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getModelsPayload(req.app.locals.models));
});

router.post('/', (req, res) => {
  try {
    const updates = req.body || {};
    const hasUpdate = ['textModel', 'visionModel', 'imageModel'].some((key) => updates[key] !== undefined);

    if (!hasUpdate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Provide at least one of textModel, visionModel, or imageModel',
      });
    }

    req.app.locals.models = applyModelUpdates(req.app.locals.models, updates);
    console.log('[MODELS] updated', req.app.locals.models);
    res.json(getModelsPayload(req.app.locals.models));
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

module.exports = router;
