const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
    console.log('Testing Registration...');
    try {
        const user = {
            fullName: 'Debug User',
            email: `debug_${Date.now()}@test.com`,
            password: 'password123',
            phone: '1234567890',
            role: 'driver'
        };

        const res = await axios.post(`${API_URL}/auth/register`, user);
        console.log('✅ Registration Code:', res.status);
        console.log('✅ Registration Data:', res.data);
    } catch (error) {
        console.error('❌ Registration Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAuth();
