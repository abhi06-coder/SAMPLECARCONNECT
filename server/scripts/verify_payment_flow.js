import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function runTest() {
    try {
        console.log('--- Starting Payment Details Verification ---');

        // 1. Register User
        const email = `test_driver_${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`\n1. Registering new user: ${email}`);

        await axios.post(`${API_URL}/auth/register`, {
            name: 'Test Driver',
            email,
            password
        });
        console.log('   User registered.');

        // 2. Login
        console.log('\n2. Logging in to get token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('   Login successful. Token received.');

        // 3. Update Profile with Payment Info
        console.log('\n3. Updating Profile with Payment Details...');
        const paymentData = {
            vehicle: {
                model: 'Test Car',
                plateNumber: 'TST-123',
                capacity: 4
            },
            paymentDetails: {
                upiId: 'testuser@upi',
                qrCodeUrl: 'http://example.com/fake-qr-code.png'
            }
        };

        const updateRes = await axios.put(`${API_URL}/users/profile`, paymentData, config);

        if (updateRes.data.paymentDetails?.upiId === 'testuser@upi') {
            console.log('   SUCCESS: API returned updated payment info.');
        } else {
            console.error('   FAILURE: API did not return correct payment info:', updateRes.data);
            return;
        }

        // 4. Verify Persistence (Get Profile)
        console.log('\n4. Verifying persistence via GET /profile...');
        const profileRes = await axios.get(`${API_URL}/users/profile`, config);

        const retrievedPayment = profileRes.data.paymentDetails;
        if (retrievedPayment?.upiId === 'testuser@upi' &&
            retrievedPayment?.qrCodeUrl === 'http://example.com/fake-qr-code.png') {
            console.log('   SUCCESS: Payment info persisted and retrieved correctly.');
            console.log(`   Detailed Check: UPI=${retrievedPayment.upiId}, QR=${retrievedPayment.qrCodeUrl}`);
        } else {
            console.error('   FAILURE: Persistence verification failed.', retrievedPayment);
        }

        console.log('\n--- Test Completed Successfully ---');

    } catch (error) {
        console.error('\n!!! TEST FAILED !!!');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

runTest();
