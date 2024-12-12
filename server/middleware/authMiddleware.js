// middleware/authMiddleware.js
require('dotenv').config();

const checkAuth = (req, res, next) => {
  const { code } = req.body;

  if (!code || code !== process.env.theCode) {
    console.log('Unauthorized access attempt');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing authorization code'
    });
  }

  // Add auth info to request for use in routes
  req.isAuthenticated = true;
  next();
};

// Optional: Add specific route auth middleware
const checkImageAuth = (req, res, next) => {
  const { stuff } = req.body;
  if (stuff && stuff.toLowerCase().includes('inappropriate')) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Content filter activated' 
    });
  }
  next();
};

// Optional: Add specific chat auth middleware  
const checkChatAuth = (req, res, next) => {
  const { text } = req.body;
  if (text && text.length > 500) {
    return res.status(400).json({
      error: 'Bad Request', 
      message: 'Message too long'
    });
  }
  next();
};

module.exports = {
  checkAuth,
  checkImageAuth,
  checkChatAuth
};