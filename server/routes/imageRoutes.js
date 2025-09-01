// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { checkImageAuth } = require('../middleware/authMiddleware');
const {
  upload,
  handleUploadError,
  validateUpload
} = require('../middleware/uploadMiddleware');
const axios = require('axios');

// Lightweight request logging for image routes (helps debug mobile issues on DO)
const logRequest = (req, res, next) => {
  const start = Date.now();
  const rid = Math.random().toString(36).slice(2, 8);
  req._rid = rid;
  console.log(`[IMG][${rid}] ${req.method} ${req.originalUrl} ct=${req.headers['content-type'] || ''} cl=${req.headers['content-length'] || ''}`);
  console.log(`[IMG][${rid}] ua="${(req.headers['user-agent'] || '').slice(0, 140)}"`);
  res.on('finish', () => {
    const fileInfo = req.file ? `${req.file.mimetype || 'unknown'} ${req.file.size || 0}b` : 'no-file';
    console.log(`[IMG][${rid}] status=${res.statusCode} dur=${Date.now() - start}ms file=${fileInfo}`);
  });
  next();
};

router.use(logRequest);

// Image analysis endpoint
router.post('/analyze',
  upload.single('file'),
  handleUploadError,
  validateUpload,
  checkImageAuth,
  async (req, res) => {
    const file = req.file;
    const stuff = req.body.stuff;
    console.log('sendImage route')
    stuff ? console.log(stuff, '<--text prompt') : '';

    try {
      if (!file || !file.buffer) {
        console.error(`[IMG][${req._rid}] Missing file buffer; mimetype=${file && file.mimetype}`);
        return res.status(400).json({ error: 'No file buffer', message: 'Upload failed to include file data' });
      }
      if (!file.mimetype) {
        console.error(`[IMG][${req._rid}] Missing mimetype on upload`);
        return res.status(400).json({ error: 'Unknown MIME type', message: 'File has no mimetype' });
      }
      const base64Image = file.buffer.toString('base64');
      const model = (req.app.locals.models && req.app.locals.models.visionModel) || process.env.OPENAI_VISION_MODEL || 'gpt-4o';
      const response = await req.app.locals.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: stuff || "What is in this image?" },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/${file.mimetype.split('/')[1]};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });
      console.log(`[IMG][${req._rid}] OpenAI vision OK len=${(response.choices[0].message.content || '').length}`)
      res.json({ type: 'text', content: response.choices[0].message.content });
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`[IMG][${req._rid}] Error analyze`, { status, message: error.message, data: typeof data === 'string' ? data.slice(0, 200) : (data && JSON.stringify(data).slice(0, 200)) });
      res.status(500).json({ error: 'Failed to process the file', status, message: error.message });
    }
  });

// Image generation endpoint
router.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const model = (req.app.locals.models && req.app.locals.models.imageModel) || process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
    const response = await req.app.locals.openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });
    const imageUrl = response.data[0].url;
    console.log(`[IMG][${req._rid}] Image generated url=${imageUrl ? 1 : 0}`);
    res.json({ type: 'image', content: imageUrl });
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(`[IMG][${req._rid}] Error generate`, { status, message: error.message, data: typeof data === 'string' ? data.slice(0, 200) : (data && JSON.stringify(data).slice(0, 200)) });
    res.status(500).json({ error: 'Failed to generate image', status, message: error.message });
  }
});

module.exports = router;

// Secure proxy download to bypass browser CORS when saving generated images
router.get('/download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Basic allowlist to mitigate SSRF risk
    const parsed = new URL(url);
    const allowedHosts = [
      'oaidalleapiprodscus.blob.core.windows.net',
      'oaidalleapiprodscusnorthcentralus.blob.core.windows.net',
      'oaidalleapiprodscuseast.blob.core.windows.net',
      'aiinfra-sa-prod-eastus-blob.blob.core.windows.net',
    ];
    if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.blob.core.windows.net'))) {
      return res.status(400).json({ error: 'Host not allowed for download' });
    }

    const response = await axios.get(url, { responseType: 'stream' });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'img';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="generated-image-${Date.now()}.${extension}"`);

    response.data.pipe(res);
  } catch (err) {
    console.error('Image download proxy error:', err.message);
    res.status(500).json({ error: 'Failed to download image' });
  }
});