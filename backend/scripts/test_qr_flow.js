const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const USER_EMAIL = 'user@smartparking.com'; // Use existing user or create one
const USER_PASS = 'password123'; // Replace with valid credential if known or create new user

// Since we might not know the password, let's register a temporary user for testing
const TEMP_USER = {
    fullName: 'Test QR User',
    email: `qr_test_${Date.now()}@test.com`,
    password: 'password123',
    phone: '1234567890',
    role: 'driver'
};

async function testQRFlow() {
    try {
        console.log('🚀 Starting QR Flow Test...');

        // 1. Register/Login
        console.log('1. Registering new user...');
        let token;
        try {
            const regRes = await axios.post(`${API_URL}/auth/signup`, TEMP_USER);
            token = regRes.data.data.token;
            console.log('✅ Registered successfully. Token obtained.');
        } catch (e) {
            console.error('Registration failed:', e.response ? e.response.data : e.message);
            return;
        }

        // 2. Add Vehicle (Required for booking)
        console.log('2. Adding vehicle...');
        let vehicleId;
        try {
            const vehRes = await axios.post(`${API_URL}/vehicles`, {
                licensePlate: `QR-${Math.floor(Math.random()*1000)}`,
                type: 'car',
                model: 'Test Car',
                color: 'Blue'
            }, { headers: { Authorization: `Bearer ${token}` } });
            vehicleId = vehRes.data.data.vehicle.id;
            console.log('✅ Vehicle added. ID:', vehicleId);
        } catch (e) {
            console.error('Vehicle add failed:', e.response ? e.response.data : e.message);
            return;
        }

        // 3. Create Booking
        console.log('3. Creating Booking...');
        let bookingId;
        try {
            const bookRes = await axios.post(`${API_URL}/bookings`, {
                zoneId: 1, // Assuming zone 1 exists
                vehicleId: vehicleId,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                totalPrice: 50
            }, { headers: { Authorization: `Bearer ${token}` } });
            bookingId = bookRes.data.data.booking.id;
            console.log('✅ Booking created. ID:', bookingId);
        } catch (e) {
            console.error('Booking creation failed:', e.response ? e.response.data : e.message);
            // If wallet balance is low, we might need to top up.
            // But let's assume default or free for now, or catch error.
            if (e.response && e.response.data.error.includes('balance')) {
                 console.log('⚠️ Insufficient balance. Attempting Top-up...');
                 await axios.post(`${API_URL}/wallet/topup`, { amount: 1000 }, { headers: { Authorization: `Bearer ${token}` } });
                 console.log('✅ Top-up successful. Retrying booking...');
                 // Retry booking
                 const retryRes = await axios.post(`${API_URL}/bookings`, {
                    zoneId: 1,
                    vehicleId: vehicleId,
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 3600000).toISOString(),
                    totalPrice: 50
                }, { headers: { Authorization: `Bearer ${token}` } });
                bookingId = retryRes.data.data.booking.id;
                console.log('✅ Retry Booking created. ID:', bookingId);
            } else {
                return;
            }
        }

        // 4. Fetch My Bookings (Verify it appears)
        console.log('4. Fetching My Bookings...');
        try {
            const myRes = await axios.get(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } });
            const bookings = myRes.data.data.bookings;
            const found = bookings.find(b => b.id === bookingId);
            if (found) {
                console.log('✅ Booking found in list.');
            } else {
                console.error('❌ Booking NOT found in list.');
            }
        } catch (e) {
            console.error('Fetch bookings failed:', e.message);
        }

        // 5. Scan Booking (Simulate Entry)
        console.log('5. Scanning Booking (Entry)...');
        try {
            const scanRes = await axios.post(`${API_URL}/bookings/${bookingId}/scan`, {}, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ Scan successful.');
            console.log('   Entry Time:', scanRes.data.data.entryTime);
            console.log('   Status:', scanRes.data.data.booking.status);
            
            if (scanRes.data.data.entryTime) {
                console.log('🎉 TEST PASSED: Full QR flow verified.');
            } else {
                console.error('❌ TEST FAILED: Entry time not set.');
            }
        } catch (e) {
            console.error('Scan failed:', e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error('Test error:', error);
    }
}

testQRFlow();
