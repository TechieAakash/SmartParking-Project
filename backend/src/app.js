/**
 * Express App Configuration - Updated for UI alignment
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// CORS Configuration - Allow frontend access
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
// On Vercel, we usually let Vercel handle static files for better performance
const isVercel = process.env.VERCEL === '1';
const frontendPath = path.join(__dirname, '../../frontend');

if (!isVercel) {
  app.use(express.static(frontendPath));
}

// API Routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'UP', timestamp: new Date() });
});

// Serve index.html for root path only if not on Vercel
app.get('/', (req, res) => {
  if (isVercel) {
    return res.redirect('/index.html'); // Vercel handles the static file
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

module.exports = app;
