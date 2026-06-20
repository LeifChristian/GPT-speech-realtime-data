// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept any image/* mimetype. Some mobile browsers send application/octet-stream.
  const mime = (file.mimetype || '').toLowerCase();
  const isImage = mime.startsWith('image/') || mime === 'application/octet-stream';
  if (isImage) return cb(null, true);
  cb(new Error('Error: Images Only!'));
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size (mobile photos can be large)
    files: 1 // Maximum 1 file per request
  },
  fileFilter: fileFilter
});

// Error handler middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size cannot exceed 10MB'
      });
    }
    return res.status(400).json({
      error: err.code,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }

  next();
};

// Validate uploaded file middleware
const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please select a file to upload'
    });
  }

  // Add file info to request
  req.fileInfo = {
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    encoding: req.file.encoding
  };

  next();
};

// Clean up temporary files middleware
const cleanupUpload = (req, res, next) => {
  if (req.file && req.file.buffer) {
    // Clean up the buffer after response is sent
    res.on('finish', () => {
      delete req.file.buffer;
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError,
  validateUpload,
  cleanupUpload
};