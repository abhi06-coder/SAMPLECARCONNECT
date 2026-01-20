import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));
app.use(cookieParser());

// Database Connection
// Database Connection
connectDB();

import { initScheduler } from './jobs/reminderCron.js';
initScheduler();

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

import commuteRoutes from './routes/commuteRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/commute', commuteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);

// Socket.io
// In-memory store for last known locations
const rideLocations = new Map(); // Driver location: { rideId: locationData }
const passengerLocations = new Map(); // Passenger location: { rideId: locationData } (Simplification: assuming 1 active passenger for demo or just last one)

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_ride', (rideId) => {
        socket.join(rideId);
        console.log(`User ${socket.id} joined ride ${rideId}`);

        // Send last known DRIVER location to the new joiner (Passenger or Driver joining self)
        const lastDriverLoc = rideLocations.get(rideId);
        if (lastDriverLoc) {
            socket.emit('car-moved', lastDriverLoc);
        }

        // Send last known PASSENGER location to the new joiner (Driver)
        const lastPassengerLoc = passengerLocations.get(rideId);
        if (lastPassengerLoc) {
            socket.emit('passenger-moved', lastPassengerLoc);
        }
    });

    socket.on('register_user', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} registered as ${userId}`);
    });

    socket.on('car-moved', (data) => {
        const { rideId, location } = data;

        // Store last driver location
        rideLocations.set(rideId, location);

        // Broadcast to everyone in the room EXCEPT the sender (driver)
        socket.to(rideId).emit('car-moved', location);
    });

    socket.on('passenger-moved', (data) => {
        const { rideId, location } = data;

        // Store last passenger location
        passengerLocations.set(rideId, location);

        // Broadcast to everyone in the room (specifically for the driver to see)
        socket.to(rideId).emit('passenger-moved', location);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.set('io', io);

app.get('/', (req, res) => {
    res.send('CarConnect API is running');
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
