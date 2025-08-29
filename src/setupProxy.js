const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const target = 'http://localhost:3001';
  app.use('/process-audio', createProxyMiddleware({ target, changeOrigin: true }));
  app.use('/chat', createProxyMiddleware({ target, changeOrigin: true }));
  app.use('/image', createProxyMiddleware({ target, changeOrigin: true }));
  app.use('/file', createProxyMiddleware({ target, changeOrigin: true }));
  app.use('/score', createProxyMiddleware({ target, changeOrigin: true }));
};
