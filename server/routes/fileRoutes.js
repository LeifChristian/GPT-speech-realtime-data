// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { checkAuth } = require('../middleware/authMiddleware');

router.post('/save', checkAuth, async (req, res) => {
  const { text, content } = req.body;
  
  try {
    // Input validation
    if (!content) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Content is required' 
      });
    }

    // Set up file name and path
    let fileName;
    const cwd = process.cwd();
    const saveDir = path.join(cwd, 'savedConvos');

    // Ensure save directory exists
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // Generate file name
    if (text && text.length) {
      fileName = path.join(saveDir, `${text}.txt`);
      // If file exists, create unique name
      if (fs.existsSync(fileName)) {
        fileName = path.join(saveDir, `${text}_${uuidv4()}.txt`);
      }
    } else {
      fileName = path.join(saveDir, `${uuidv4()}.txt`);
    }

    // Write file
    await fs.promises.writeFile(fileName, content);
    
    console.log('File saved:', path.basename(fileName));
    
    res.json({ 
      success: true,
      message: 'File saved successfully',
      fileName: path.basename(fileName)
    });

  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to save file',
      details: error.message
    });
  }
});

// Optional: Add route to get list of saved files
router.get('/list', checkAuth, (req, res) => {
  try {
    const cwd = process.cwd();
    const saveDir = path.join(cwd, 'savedConvos');
    
    if (!fs.existsSync(saveDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(saveDir)
      .filter(file => file.endsWith('.txt'))
      .map(file => ({
        name: file,
        path: path.join('savedConvos', file),
        created: fs.statSync(path.join(saveDir, file)).birthtime
      }));

    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to list files'
    });
  }
});

// Optional: Add route to get specific file content
router.get('/:filename', checkAuth, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'savedConvos', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'File not found' 
      });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to read file'
    });
  }
});

// Optional: Add route to delete file
router.delete('/:filename', checkAuth, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'savedConvos', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'File not found' 
      });
    }

    fs.unlinkSync(filePath);
    res.json({ 
      success: true,
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete file'
    });
  }
});

module.exports = router;