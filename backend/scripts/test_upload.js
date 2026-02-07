const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
    const token = 'YOUR_TEST_TOKEN'; // Replace with a valid token
    const apiUrl = 'http://localhost:5000/api/auth/profile';

    const form = new FormData();
    form.append('profilePhoto', fs.createReadStream('MCDlogo.png'));

    try {
        const response = await axios.put(apiUrl, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Need a valid token to test. I'll search for one in current session or skip automated test and just apply fix.
console.log('This script needs a valid JWT token to run.');
