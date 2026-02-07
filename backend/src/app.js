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
// On Vercel, we usually let Vercel handle static files for better performance
const isVercel = process.env.VERCEL === '1';
const frontendPath = path.join(__dirname, '../../frontend');

if (!isVercel) {
  app.use(express.static(frontendPath));
}

// Google OAuth Routes (Support both /api/auth and /auth to prevent redirect mismatches)
const authPaths = ['/api/auth/google', '/auth/google'];
const callbackPaths = ['/api/auth/google/callback', '/auth/google/callback'];

app.get(authPaths, 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(callbackPaths,
  passport.authenticate('google', { 
    failureRedirect: '/login?error=oauth_failed',
    session: false 
  }),
  (req, res) => {
    // Successful authentication - redirect with token
    const { token, refreshToken, user } = req.user;
    
    // Determine frontend URL
    const frontendUrl = process.env.CORS_ORIGIN || 'https://mcd-smart-parking.onrender.com';
    const baseUrl = frontendUrl.split(',')[0].trim();
    
    // Redirect to frontend with token in URL (frontend will store it)
    res.redirect(`${baseUrl}/index.html?oauth=success&token=${token}&refreshToken=${refreshToken}&userId=${user.id}`);
  }
);

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
