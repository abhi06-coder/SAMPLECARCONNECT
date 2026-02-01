import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import RefundRequest from '../models/RefundRequest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkRefunds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const refunds = await RefundRequest.find().populate('driverId', 'name email');

        console.log(`\n📊 Total Refund Requests: ${refunds.length}\n`);

        if (refunds.length > 0) {
            refunds.forEach((refund, index) => {
                console.log(`${index + 1}. ID: ${refund._id}`);
                console.log(`   Driver: ${refund.driverId?.name} (${refund.driverId?.email})`);
                console.log(`   Type: ${refund.type}`);
                console.log(`   Amount: ₹${refund.amount}`);
                console.log(`   Status: ${refund.status}`);
                console.log(`   Reason: ${refund.reason}`);
                console.log(`   Created: ${refund.createdAt}`);
                console.log('---');
            });
        } else {
            console.log('❌ No refund requests found in database');
        }

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkRefunds();
