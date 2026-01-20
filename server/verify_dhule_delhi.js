
import mongoose from 'mongoose';
import Ride from './models/Ride.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create Ride: Mumbai -> Delhi (2 SEATS)
        // Approx 1000km. 100 segments.
        const ride = new Ride({
            driver: new mongoose.Types.ObjectId(),
            source: { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
            destination: { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
            // Add required GeoJSON
            sourceLocation: { type: 'Point', coordinates: [72.8777, 19.0760] },
            destLocation: { type: 'Point', coordinates: [77.1025, 28.7041] },
            routePath: { type: 'LineString', coordinates: [[72.8777, 19.0760], [77.1025, 28.7041]] },

            dateTime: new Date(),
            price: 2000,
            totalSeats: 2,
            availableSeats: 2,
            totalDistance: 1000,
            vehicle: { model: 'Test Car', plateNumber: 'TEST-123', capacity: 4 },
            stops: [],
            // Initialize 100 segments with 2 seats
            segmentAvailability: Array.from({ length: 100 }, (_, i) => ({ index: i, seats: 2 }))
        });

        await ride.save();
        console.log(`Region 1: Ride Created (${ride._id}) with 2 seats globally.`);

        // 2. Book Mumbai -> Dhule (Indices 0 to 30 roughly) for 2 SEATS
        // This simulates the "Mumbai to Dhule" booking.
        const pickupIdx = 0;
        const dropoffIdx = 30; // 300km
        const seatsToBook = 2;

        await Ride.updateOne(
            { _id: ride._id },
            {
                $inc: {
                    "segmentAvailability.$[elem].seats": -seatsToBook,
                    "availableSeats": -seatsToBook
                }
            },
            { arrayFilters: [{ "elem.index": { $gte: pickupIdx, $lt: dropoffIdx } }] }
        );

        // Fetch after booking
        const bookedRide = await Ride.findById(ride._id);
        console.log(`Region 2: Booking Complete (Mumbai-Dhule).`);
        console.log(`Global Available Seats: ${bookedRide.availableSeats}`); // Should be 0
        console.log(`Segment 0 Seats: ${bookedRide.segmentAvailability[0].seats}`); // Should be 0
        console.log(`Segment 50 Seats (Delhi side): ${bookedRide.segmentAvailability[50].seats}`); // Should be 2

        // 3. Verify Availability for Dhule -> Delhi (Indices 30 to 100)
        // Simulation of RideController FILTER logic
        // We know the controller fetches this ride now (because we removed the global > 0 check).
        // Does the segment check pass?

        const searchPickupIdx = 30;
        const searchDropoffIdx = 100;
        const searchSeats = 2; // Searching for 2 seats again

        const segmentRange = bookedRide.segmentAvailability.slice(searchPickupIdx, searchDropoffIdx);
        const isUnavailable = segmentRange.some(seg => seg.seats < searchSeats);

        if (isUnavailable) {
            console.log("FAIL: Dhule->Delhi is flagged as UNAVAILABLE.");
        } else {
            console.log("PASS: Dhule->Delhi is flagged as AVAILABLE.");
        }

        console.log(`Search Request: 2 seats from idx ${searchPickupIdx} to ${searchDropoffIdx}.`);

        // Cleanup
        await Ride.findByIdAndDelete(ride._id);
        mongoose.connection.close();

    } catch (error) {
        console.error('Test Failed:', error);
        mongoose.connection.close();
    }
};

runTest();
