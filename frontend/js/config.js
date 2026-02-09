// Configuration
// Auto-detect environment: Use Render backend in production, localhost in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Production API on Render (relative for fetch, full URL for OAuth)
const PRODUCTION_API_URL = '/api';
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

// Backend URL for OAuth redirects (must be full URL)
const PRODUCTION_BACKEND_URL = 'https://smartparking-backend-production.up.railway.app';
const DEVELOPMENT_BACKEND_URL = 'http://localhost:5000';
const BACKEND_URL = isProduction ? PRODUCTION_BACKEND_URL : DEVELOPMENT_BACKEND_URL;

const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// Debug: Log which environment is being used
console.log(`🔗 API Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📡 API URL: ${API_BASE_URL}`);
console.log(`🔐 Backend URL (OAuth): ${BACKEND_URL}`);

let map, markers = [], parkingZones = [], originalZones = [], violations = [];
let currentUser = null;

