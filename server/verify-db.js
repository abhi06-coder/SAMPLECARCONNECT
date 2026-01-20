import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const verifyUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({}).sort({ createdAt: -1 }).limit(5);

        console.log('\n--- Recent Users ---');
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            users.forEach(u => {
                console.log(`- ${u.name} (${u.email}) | Driver: ${u.isDriver} | Deposit: ${u.depositPaid}`);
            });
        }
        console.log('--------------------\n');

        process.exit();
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        process.exit(1);
    }
};

verifyUsers();
