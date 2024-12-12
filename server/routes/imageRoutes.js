// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { checkImageAuth } = require('../middleware/authMiddleware');
const { 
  upload, 
  handleUploadError, 
  validateUpload 
} = require('../middleware/uploadMiddleware');

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
      const response = await req.app.locals.openai.chat.completions.create({
        model: "gpt-4o",
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
    const response = await req.app.locals.openai.images.generate({
      model: "dall-e-3",
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