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
      console.log(response.choices[0].message.content, "<--- response")
      res.json({ type: 'text', content: response.choices[0].message.content });
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to process the file' });
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
    res.json({ type: 'image', content: imageUrl });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate image' });
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