// Configuration
// Auto-detect environment: Use Railway backend in production, localhost in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// ⚠️ IMPORTANT: Replace 'YOUR-RAILWAY-BACKEND-URL' with your actual Railway backend URL after deployment
// Example: 'https://smartparking-backend-production.up.railway.app/api'
const PRODUCTION_API_URL = 'https://YOUR-RAILWAY-BACKEND-URL.railway.app/api';
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// Debug: Log which environment is being used
console.log(`🔗 API Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📡 API URL: ${API_BASE_URL}`);

let map, markers = [], parkingZones = [], originalZones = [], violations = [];
let currentUser = null;
