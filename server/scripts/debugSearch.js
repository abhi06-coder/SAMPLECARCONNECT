
import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import { searchRides } from '../controllers/rideController.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URI = "mongodb://127.0.0.1:27017/carconnect_test_search"; // Local test DB

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to Test DB");

        await Ride.deleteMany({});
        await Ride.init(); // Create indexes
        console.log("Indexes ensured.");

        // Create Ride: Mumbai -> Delhi (Straight Line)
        // Nashik is roughly (20.0, 73.8)
        // Line Mumbai(19.07, 72.87) -> Delhi(28.7, 77.1)
        const ride = await Ride.create({
            driver: new mongoose.Types.ObjectId(),
            source: { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
            destination: { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
            sourceLocation: { type: 'Point', coordinates: [72.8777, 19.0760] },
            destLocation: { type: 'Point', coordinates: [77.1025, 28.7041] },
            // Route passed through Nashik (19.99, 73.78) and Dhule (20.90, 74.77)
            routePath: {
                type: 'LineString',
                coordinates: [
                    [72.8777, 19.0760], // Mumbai
                    [73.7898, 19.9975], // Nashik (Approx)
                    [74.7749, 20.9042], // Dhule (Approx)
                    [77.1025, 28.7041]  // Delhi
                ]
            },
            dateTime: new Date(Date.now() + 86400000),
            price: 2000,
            totalSeats: 3,
            availableSeats: 3,
            totalDistance: 1400,
            vehicle: { model: 'Test', plateNumber: '123', capacity: 4 },
            status: 'active',
            stops: [
                { name: 'Nashik', lat: 19.9975, lng: 73.7898, stopIndex: 1 },
                { name: 'Dhule', lat: 20.9042, lng: 74.7749, stopIndex: 2 }
            ],
            segmentAvailability: []
        });

        console.log("Ride Created:", ride._id);

        // Test 1: Search Nashik -> Dhule (Coordinates)
        // Nashik Coords
        const reqGeo = {
            query: {
                sourceLat: '19.9975',
                sourceLng: '73.7898', // Nashik
                destLat: '20.9042',
                destLng: '74.7749', // Dhule
                date: new Date().toISOString()
            }
        };

        const resGeo = {
            json: (data) => {
                console.log(`[Geo Search] Found ${data.length} rides.`);
                if (data.length === 0) console.log("FAIL: Geo search returned 0.");
                else console.log("PASS: Geo search found ride.");
            },
            status: (code) => ({ json: (d) => console.log("Status:", code, d) })
        };

        console.log("Running Geo Search for Nashik...");
        await searchRides(reqGeo, resGeo);


        // Test 2: Search Nashik -> Dhule (Text Only)
        // Simulating case where coords are missing
        const reqText = {
            query: {
                source: 'Nashik',
                destination: 'Dhule',
                date: new Date().toISOString()
            }
        };

        const resText = {
            json: (data) => {
                console.log(`[Text Search] Found ${data.length} rides.`);
                if (data.length === 0) console.log("FAIL: Text search returned 0 (Expected for current buggy impl).");
                else console.log("PASS: Text search found ride.");
            },
            status: (code) => ({ json: (d) => console.log("Status:", code, d) })
        };

        console.log("Running Text Search for Nashik...");
        await searchRides(reqText, resText);


    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
