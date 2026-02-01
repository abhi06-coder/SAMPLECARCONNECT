import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Ride from '../models/Ride.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
let cookie = '';
let testUserId = '';
let rideId = '';

const setup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Cleanup previous test user
        const email = 'wallet_test@example.com';
        await User.deleteOne({ email });
        console.log('🧹 Cleaned up previous test user');

        // Create Test User
        const user = await User.create({
            name: 'Wallet Tester',
            email,
            password: 'password123',
            walletBalance: 0, // Start with 0
            isDriver: false
        });
        testUserId = user._id;
        console.log('👤 Created Test User:', user.email);

    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
};

const login = async () => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'wallet_test@example.com',
            password: 'password123'
        });

        // Extract cookie
        const cookieHeader = res.headers['set-cookie'];
        if (cookieHeader) {
            cookie = cookieHeader[0].split(';')[0];
        }
        console.log('🔓 Login Successful');
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

const runTests = async () => {
    const api = axios.create({
        baseURL: API_URL,
        headers: { Cookie: cookie },
        withCredentials: true
    });

    console.log('\n--- 🧪 TEST 1: Ride Creation with Insufficient Funds ---');
    try {
        await api.post('/rides/create', {
            dateTime: new Date(Date.now() + 3600000), // 1 hour later
            price: 500,
            source: { name: 'A', lat: 10, lng: 10 },
            destination: { name: 'B', lat: 11, lng: 11 },
            maxPassengers: 2
        });
        console.error('❌ Failed: Should not allow ride creation with 0 balance');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Passed: Blocked ride creation (Insufficient Funds)');
        } else {
            console.error('❌ Failed: Unexpected error', error.response?.data);
        }
    }

    console.log('\n--- 🧪 TEST 2: Wallet Update & Successful Creation ---');
    // Direct DB update to simulate deposit
    await User.findByIdAndUpdate(testUserId, { walletBalance: 100, isDriver: true });
    console.log('💰 Wallet updated to ₹100');

    try {
        const res = await api.post('/rides/create', {
            dateTime: new Date(Date.now() + 3600000 * 2), // 2 hours later
            price: 500,
            vehicle: { model: 'Test Car', plateNumber: 'TEST-123', capacity: 4 },
            source: { name: 'Start', lat: 28.6139, lng: 77.2090 },
            destination: { name: 'End', lat: 28.5355, lng: 77.3910 },
            totalSeats: 3
        });
        rideId = res.data.ride._id;
        console.log('✅ Passed: Ride Created Successfully:', rideId);
    } catch (error) {
        console.error('❌ Failed to create ride:', error.response?.data || error.message);
    }

    console.log('\n--- 🧪 TEST 3: Normal Cancellation (No Penalty) ---');
    try {
        const res = await api.delete(`/rides/${rideId}/cancel`);
        const user = await User.findById(testUserId);
        if (user.walletBalance === 100) {
            console.log('✅ Passed: Normal cancellation preserved wallet balance (₹100)');
        } else {
            console.error(`❌ Failed: Wallet balance changed to ₹${user.walletBalance}`);
        }
    } catch (error) {
        console.error('❌ Cancel failed:', error);
    }

    console.log('\n--- 🧪 TEST 4: Late Cancellation Penalty (Start in 10 mins) ---');
    // 1. Reset wallet and create simple ride
    await User.findByIdAndUpdate(testUserId, { walletBalance: 100 });
    const lateRideRes = await api.post('/rides/create', {
        dateTime: new Date(Date.now() + 10 * 60000), // 10 mins from now
        price: 300,
        source: { name: 'A', lat: 10, lng: 10 },
        destination: { name: 'B', lat: 11, lng: 11 },
        totalSeats: 2,
        vehicle: { model: 'Test Car', plateNumber: 'TEST-123', capacity: 4 },
    });
    const lateRideId = lateRideRes.data.ride._id;
    console.log('🚗 Created late ride:', lateRideId);

    // 2. Cancel it
    try {
        const cancelRes = await api.delete(`/rides/${lateRideId}/cancel`);
        console.log('⚠️ Cancel Response:', cancelRes.data.message);

        const user = await User.findById(testUserId);
        if (user.walletBalance === 0) {
            console.log('✅ Passed: Late cancellation penalty applied. Wallet is ₹0');
        } else {
            console.error(`❌ Failed: Wallet is still ₹${user.walletBalance}`);
        }
    } catch (error) {
        console.error('❌ Late cancel failed:', error);
    }

    console.log('\n--- 🧪 Cleanup ---');
    await User.deleteOne({ _id: testUserId });
    await mongoose.disconnect();
    console.log('✅ Cleanup Complete');
};

const main = async () => {
    await setup();
    await login();
    await runTests();
};

main();
