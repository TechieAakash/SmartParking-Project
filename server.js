const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import database connection
const { testConnection } = require('./db/database');

// Import routes
const authRouter = require('./routes/auth');
const zonesRouter = require('./routes/zones');
const violationsRouter = require('./routes/violations');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for frontend
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080', 'file://'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/violations', violationsRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const { ParkingZone, Violation } = require('./models');
    const zonesCount = await ParkingZone.count();
    const violationsCount = await Violation.count();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      stats: {
        parking_zones: zonesCount,
        violations: violationsCount
      },
      tables: {
        parking_zones: 'Exists',
        violations: 'Exists'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Serve frontend static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend HTML for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Endpoint not found',
      available_endpoints: {
        zones: '/api/zones',
        violations: '/api/violations',
        health: '/health',
        db_test: '/api/db-test'
      }
    });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server only if database connection is successful
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server not started.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💾 Database: MySQL (smartparking)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();