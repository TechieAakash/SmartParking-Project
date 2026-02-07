const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_Base = 'http://localhost:5000/api'; // Testing local backend against remote DB

// Use a known user or login first
async function testProfileFlow() {
  try {
    // 1. Login to get token (using a test account I can create or use existing)
    // I'll try to register a temporary user to ensure clean state
    const email = `test_driver_${Date.now()}@mcd.gov.in`;
    const password = 'password123';
    
    console.log(`1. Registering/Logging in user: ${email}`);
    
    let token;
    try {
        const regRes = await axios.post(`${API_Base}/auth/register`, {
            fullName: 'Test Driver',
            email: email,
            username: `driver_${Date.now()}`,
            password: password,
            role: 'driver',
            phone: '9876543210'
        });
        token = regRes.data.data.token;
        console.log('   Registration successful. Token acquired.');
    } catch (e) {
        // If registration fails (e.g. email exists), try login
        console.log('   Registration failed (maybe exists), trying login...');
        const loginRes = await axios.post(`${API_Base}/auth/login`, {
            email: email,
            password: password
        });
        token = loginRes.data.data.token;
        console.log('   Login successful. Token acquired.');
    }

    if (!token) throw new Error('Failed to get token');

    const headers = { 'Authorization': `Bearer ${token}` };

    // 2. Fetch Profile
    console.log('2. Fetching Profile...');
    const profileRes = await axios.get(`${API_Base}/auth/profile`, { headers });
    console.log('   Profile Data:', profileRes.data.data.user.email);

    // 3. Fetch Wallet
    console.log('3. Fetching Wallet Balance...');
    const walletRes = await axios.get(`${API_Base}/wallet/balance`, { headers });
    console.log('   Wallet Balance:', walletRes.data.data.balance);

    // 4. Fetch Bookings
    console.log('4. Fetching Bookings...');
    const bookingRes = await axios.get(`${API_Base}/bookings/my`, { headers });
    console.log(`   Bookings Found: ${bookingRes.data.data.bookings.length}`);

    // 5. Fetch Vehicles
    console.log('5. Fetching Vehicles...');
    const vehicleRes = await axios.get(`${API_Base}/vehicles/my`, { headers });
    console.log(`   Vehicles Found: ${vehicleRes.data.data.vehicles.length}`);

    console.log('✅ API Flow Verified Successfully!');

  } catch (error) {
    console.error('❌ API Flow Failed:', error.response ? error.response.data : error.message);
  }
}

testProfileFlow();
