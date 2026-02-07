const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const API_BASE_URL = 'http://localhost:5000/api';

async function testExport() {
  try {
    console.log("1. Logging in as admin...");
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123' // Correct password from seeds
    });
    
    const token = loginRes.data.data.token;
    console.log("✅ Logged in. Token obtained.");

    console.log("2. Requesting CSV export...");
    const exportRes = await axios.get(`${API_BASE_URL}/violations/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log("✅ Response status:", exportRes.status);
    console.log("✅ Content-Type:", exportRes.headers['content-type']);
    console.log("✅ Sample data:\n", exportRes.data.substring(0, 100));

    if (exportRes.data.includes('ID,Zone Name')) {
      console.log("\n🚀 Export logic seems to work on backend!");
    } else {
      console.log("\n❌ Unexpected data format.");
    }
  } catch (err) {
    console.error("❌ Export test failed:", err.response ? err.response.data : err.message);
  }
}

testExport();
