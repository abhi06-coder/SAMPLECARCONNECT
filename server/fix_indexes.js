import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ride from './models/Ride.js';

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('Dropping indexes on rides collection...');
        await Ride.collection.dropIndexes();
        console.log('Indexes dropped successfully');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

fixIndexes();
