const express = require('express');
const fs = require('fs');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const imageRouter = require('./routes/imageRoutes');
const chatRouter = require('./routes/chatRoutes');
const fileRouter = require('./routes/fileRoutes');
const modelRouter = require('./routes/modelRoutes');
const { getDefaultRuntime } = require('./config/models');
const { getOpenAIClient } = require('./providers/openai');

// Initialize express app
const app = express();

// OpenAI client for image generation (OpenAI-only capability for now)
const openai = getOpenAIClient();
const DEFAULT_RUNTIME = getDefaultRuntime();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(bodyParser.json());

// Make OpenAI instance available to routes
app.locals.openai = openai;

// Make upload middleware available to routes
app.locals.upload = upload;

// Runtime config (models + personality); frontend updates via POST /models
app.locals.runtime = { ...DEFAULT_RUNTIME };

// Mount routes
app.use('/models', modelRouter);
app.use('/image', imageRouter);
app.use('/chat', chatRouter);
app.use('/file', fileRouter);

// Serve frontend build in production and support SPA routing
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Create savedConvos directory if it doesn't exist
const savedConvosPath = path.join(process.cwd(), 'savedConvos');
if (!fs.existsSync(savedConvosPath)) {
  fs.mkdirSync(savedConvosPath);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!',
    message: err.message
  });
});

// Handle unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'development' ? 'localhost' : undefined;
app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST || 'all interfaces'}:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});