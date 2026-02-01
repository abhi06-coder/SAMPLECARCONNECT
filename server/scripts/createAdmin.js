import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js'; // Adjust path if needed
import connectDB from '../config/db.js'; // Adjust path if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdminUser = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@gmail.com';
        const adminPassword = '12345678';

        let user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log('User found. Updating to admin role and resetting password...');
            user.password = adminPassword; // Will be hashed by pre-save hook
            user.role = 'admin';
            user.name = 'Admin User'; // Ensure name is set
            await user.save();
            console.log('Admin user updated successfully.');
        } else {
            console.log('User not found. Creating new admin user...');
            user = await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                isVerified: true, // Auto-verify admin
            });
            console.log('Admin user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();
