import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { createRide } from '../controllers/rideController.js';
import { bookRide } from '../controllers/bookingController.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const MONGO_URI = "mongodb://127.0.0.1:27017/carconnect_test_seat_waste";

async function verifyFix() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to Test DB");

        // Clear DB
        await Ride.deleteMany({});
        await User.deleteMany({});
        await Booking.deleteMany({});

        // Create Users
        const driver = await User.create({ name: 'Driver', email: 'd@test.com', password: '123', isVerified: true, depositPaid: true });
        const p1 = await User.create({ name: 'P1', email: 'p1@test.com', password: '123' });
        const p2 = await User.create({ name: 'P2', email: 'p2@test.com', password: '123' });

        // Mock Requests
        const driverReq = {
            user: driver,
            body: {
                source: { name: 'A', lat: 0, lng: 0 },
                destination: { name: 'E', lat: 0, lng: 1 }, // ~111km
                dateTime: new Date(Date.now() + 86400000),
                totalSeats: 2,
                price: 1000,
                vehicle: { model: 'X', plateNumber: '1', capacity: 4 },
                routePath: { coordinates: [[0, 0], [0, 0.25], [0, 0.5], [0, 0.75], [0, 1]] } // ~111km, 12 segments
            }
        };

        let createdRide;
        const resCreate = {
            status: (code) => ({ json: (data) => { if (code === 201) createdRide = data.ride; console.log("Create Status:", code); } }),
            json: (data) => { if (!createdRide) createdRide = data.ride; console.log("Create JSON:", data); }
        };

        // 1. Create Ride
        await createRide(driverReq, resCreate);
        if (!createdRide) throw new Error("Ride creation failed");
        console.log("Ride Created. ID:", createdRide._id);
        console.log("Initial Global Seats:", createdRide.availableSeats);

        // 2. Book Segment 0-4 (User 1) - Should consume 1 seat in Seg 0-4

        const booking1Req = {
            user: p1,
            app: { get: () => null }, // mock io
            body: {
                rideId: createdRide._id.toString(),
                seatsBooked: 1,
                pickupGridIndex: 0,
                dropoffGridIndex: 4
            }
        };
        const resBook1 = {
            status: (code) => ({ json: (data) => console.log("Book 1 Status:", code, data.message || "") }),
            json: (data) => console.log("Book 1 Success")
        };

        await bookRide(booking1Req, resBook1);

        // Check availability
        const rideAfterBook1 = await Ride.findById(createdRide._id);
        console.log("After Book 1 - Global Seats:", rideAfterBook1.availableSeats);
        console.log("Segment 0 seats:", rideAfterBook1.segmentAvailability[0].seats); // Should be 1
        console.log("Segment 6 seats:", rideAfterBook1.segmentAvailability[6].seats); // Should be 2

        if (rideAfterBook1.availableSeats !== 1) {
            console.warn("WARNING: Global seats expectation mismatch. Expected 1 (decrement from 2), Got:", rideAfterBook1.availableSeats);
            // We allow it to be 1 or 2 depending on implementation, but key is Booking 2 must succeed.
            // If it is 1, it means we ARE decrementing global seats (which is good for Waitlist compatibility).
        } else {
            console.log("PASS: Global seats decremented correctly (compatible with Waitlist).");
        }

        // 3. Book Segment 6-10 (User 2) - Non-overlapping
        const booking2Req = {
            user: p2,
            app: { get: () => null },
            body: {
                rideId: createdRide._id.toString(),
                seatsBooked: 1,
                pickupGridIndex: 6,
                dropoffGridIndex: 10
            }
        };
        const resBook2 = {
            status: (code) => ({ json: (data) => console.log("Book 2 Status:", code, data.message || "") }),
            json: (data) => console.log("Book 2 Success")
        };

        await bookRide(booking2Req, resBook2);

        const rideAfterBook2 = await Ride.findById(createdRide._id);
        console.log("After Book 2 - Seg 6 seats:", rideAfterBook2.segmentAvailability[6].seats); // Should be 1
        console.log("After Book 2 - Global seats:", rideAfterBook2.availableSeats); // Might be 0

        if (rideAfterBook2.segmentAvailability[6].seats === 1) {
            console.log("PASS: Segment 6 decrement correct.");
        } else {
            console.error("FAIL: Segment 6 incorrect (Booking 2 failed?).");
            process.exit(1);
        }

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFix();
