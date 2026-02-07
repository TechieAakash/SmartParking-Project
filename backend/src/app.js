/**
 * Express App Configuration - Updated for UI alignment
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// CORS Configuration - Railway Production
// Use CORS_ORIGIN from environment variable set in Railway
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // If CORS_ORIGIN is '*', allow all origins
    if (allowedOrigins[0] === '*') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

console.log('🔐 CORS Origins:', allowedOrigins);

// Enable trust proxy for Render/Vercel (REQUIRED for HTTPS OAuth redirects)
app.set('trust proxy', 1);

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session for OAuth (required for passport)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'smartparking-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport for OAuth
const passport = require('./config/google.strategy');
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from frontend directory
const isVercel = process.env.VERCEL === '1';
const frontendPath = path.join(__dirname, '../../frontend');
const uploadsPath = path.join(__dirname, '../uploads');

// Ensure uploads are served (e.g. /uploads/filename.jpg)
app.use('/uploads', express.static(uploadsPath));

if (!isVercel) {
  app.use(express.static(frontendPath));
}

// Google OAuth Routes - Explicitly defined to ensure they work
// 1. Standard API Route
app.get('/api/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Short Route (for user preference)
app.get('/auth/google', (req, res, next) => {
  console.log('🔄 /auth/google route hit');
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback Routes
const handleCallback = [
  passport.authenticate('google', { 
    failureRedirect: '/index.html?error=oauth_failed&trigger=login',
    session: false 
  }),
  (req, res) => {
    // Successful authentication - redirect with token
    const { token, refreshToken, user } = req.user;
    
    // Determine frontend URL dynamically
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const defaultUrl = `${protocol}://${host}`;
    
    const frontendUrl = process.env.CORS_ORIGIN || defaultUrl;
    const baseUrl = frontendUrl.split(',')[0].trim();
    
    console.log(`📡 Redirecting to baseUrl: ${baseUrl}`);
    
    // Redirect to frontend with token in URL
    res.redirect(`${baseUrl}/index.html?oauth=success&token=${token}&refreshToken=${refreshToken}&userId=${user.id}`);
  }
];

app.get('/api/auth/google/callback', ...handleCallback);
app.get('/auth/google/callback', ...handleCallback);

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
