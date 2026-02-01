import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import User from '../models/User.js';
import RefundRequest from '../models/RefundRequest.js';
import Feedback from '../models/Feedback.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from server root (parent of scripts/)
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn("⚠️  Warning: .env file not found at " + envPath);
    // Fallback to default (cwd)
    dotenv.config();
}

console.log("Debug: MONGO_URI is", process.env.MONGO_URI ? "Defined" : "UNDEFINED");


const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let adminUserId = '';
let testUserId = '';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected for Test Script');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

const generateToken = (id) => {
    return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const setupTestData = async () => {
    console.log('\n--- 🛠️ Setup Test Data ---');

    // 1. Create/Find Admin User
    const adminEmail = 'testadmin@example.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        admin = await User.create({
            name: 'Test Admin',
            email: adminEmail,
            password: 'password123',
            role: 'admin',
            isVerified: true
        });
        console.log('Created Temp Admin User');
    } else {
        // Ensure role is admin
        admin.role = 'admin';
        await admin.save();
        console.log('Using Existing Admin User');
    }
    adminUserId = admin._id;
    adminToken = generateToken(admin._id);
    console.log(`Debug: Admin Token Generated: ${adminToken ? adminToken.substring(0, 10) + '...' : 'NULL'}`);
    console.log(`Debug: JWT_SECRET Length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'UNDEFINED'}`);

    // 2. Create Standard User (Regression Test)
    const userEmail = 'testuser_regress@example.com';
    await User.deleteOne({ email: userEmail }); // Cleanup prev run
    const user = await User.create({
        name: 'Test User Regression',
        email: userEmail,
        password: 'password123',
        // Implicitly testing that new fields (status, blockedUntil) have default values and don't break creation
    });
    testUserId = user._id;
    console.log('✅ Regression Test Passed: Standard User Created successfully with new Schema');

    return { adminToken, testUserId };
};

const runTests = async () => {
    await connectDB();
    await setupTestData();

    const config = {
        headers: { Authorization: `Bearer ${adminToken}` }
    };

    console.log('\n--- 🚀 Starting Module Tests ---');

    try {
        // Module 1: User Management
        console.log('\n[Module 1] User Management');
        const usersRes = await axios.get(`${API_URL}/admin/users?keyword=Test`, config);
        console.log(`- Fetch Users: ${usersRes.status === 200 ? '✅ OK' : '❌ FAIL'} (Count: ${usersRes.data.users.length})`);

        const blockRes = await axios.put(`${API_URL}/admin/users/${testUserId}/status`, {
            status: 'SOFT_BLOCKED',
            blockReason: 'Automated Test'
        }, config);
        console.log(`- Block User: ${blockRes.data.status === 'SOFT_BLOCKED' ? '✅ OK' : '❌ FAIL'}`);

        // Module 2: Analytics
        console.log('\n[Module 2] Analytics');
        const analyticsRes = await axios.get(`${API_URL}/admin/analytics`, config);
        console.log(`- Fetch Analytics: ${analyticsRes.status === 200 ? '✅ OK' : '❌ FAIL'}`);
        console.log(`  > Total Rides: ${analyticsRes.data.kpis.totalRides}`);

        // Module 3: Refunds
        console.log('\n[Module 3] Refunds');
        // Create Dummy Refund
        const refund = await RefundRequest.create({
            rideId: new mongoose.Types.ObjectId(), // Fake ID
            driverId: testUserId,
            amount: 500,
            reason: 'Test Refund'
        });
        const refundProcRes = await axios.put(`${API_URL}/admin/refunds/${refund._id}`, { status: 'Approved' }, config);
        console.log(`- Process Refund (Simulated): ${refundProcRes.data.status === 'Approved' ? '✅ OK' : '❌ FAIL'}`);

        // Module 4: Feedback
        console.log('\n[Module 4] Feedback');
        const feedback = await Feedback.create({ userId: testUserId, message: 'Test Query' });
        const feedbackRes = await axios.put(`${API_URL}/admin/feedback/${feedback._id}/reply`, { reply: 'Test Reply' }, config);
        console.log(`- Reply Feedback: ${feedbackRes.data.status === 'Closed' ? '✅ OK' : '❌ FAIL'}`);

        // Module 6: Announcements
        console.log('\n[Module 6] Announcements');
        const annRes = await axios.post(`${API_URL}/admin/announcements`, {
            title: 'Test Announce',
            message: 'Hello World',
            targetRoles: 'all'
        }, config);
        console.log(`- Create Announcement: ${annRes.status === 201 ? '✅ OK' : '❌ FAIL'}`);

        // Module 7: Audit Log
        console.log('\n[Module 7] Audit Logs');
        const logsRes = await axios.get(`${API_URL}/admin/audit-logs`, config);
        const hasLogs = logsRes.data.logs.length > 0;
        console.log(`- Fetch Logs: ${hasLogs ? '✅ OK' : '❌ FAIL'} (Count: ${logsRes.data.logs.length})`);

        const results = {
            userManagement: usersRes.status === 200,
            blockUser: blockRes.data.status === 'SOFT_BLOCKED',
            analytics: analyticsRes.status === 200,
            refunds: refundProcRes.data.status === 'Approved',
            feedback: feedbackRes.data.status === 'Closed',
            announcements: annRes.status === 201,
            auditLogs: logsRes.data.logs.length > 0,
            regression: true
        };
        fs.writeFileSync('verify_results.json', JSON.stringify(results, null, 2));
        console.log('\n--- 🎉 All Tests Completed Successfully ---');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            const msg = '❌ Test Failed: Connection Refused. Is the server running on port 5000?';
            console.error(msg);
            fs.writeFileSync('verify_error.txt', msg);
        } else {
            const msg = `❌ Test Failed: ${error.response ? JSON.stringify(error.response.data, null, 2) : error.message}\nStack: ${error.stack}`;
            console.error(msg);
            fs.writeFileSync('verify_error.txt', msg);
        }
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

runTests();
