// Configuration
// Auto-detect environment: Use Render backend in production, localhost in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Production API on Render
const PRODUCTION_API_URL = 'https://smartparking-project-2.onrender.com/api';
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

const API_BASE_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// Debug: Log which environment is being used
console.log(`🔗 API Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📡 API URL: ${API_BASE_URL}`);

let map, markers = [], parkingZones = [], originalZones = [], violations = [];
let currentUser = null;
