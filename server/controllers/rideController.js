import * as turf from '@turf/turf'; // Import turf
import Ride from '../models/Ride.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

// Helper function to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

import { createNewRide } from '../services/rideService.js';

// @desc    Create a new ride (Active if deposit paid)
// @route   POST /api/rides/create
// @access  Private
const createRide = async (req, res) => {
    try {
        console.log("Received Ride Data:", JSON.stringify(req.body, null, 2));

        // Check if user has paid the security deposit
        if (!req.user.depositPaid) {
            return res.status(403).json({
                success: false,
                message: 'Security deposit required to offer rides. Please pay the deposit in your profile.'
            });
        }

        // Create Ride as ACTIVE immediately
        const rideDate = new Date(req.body.dateTime);
        if (rideDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create a ride for a date/time in the past.'
            });
        }

        const rideData = {
            ...req.body,
            status: 'active',
            isDepositPaid: true, // Tied to user profile now, effectively true for the ride context
            driver: req.user._id // Ensure driver is set
        };

        // Prepare Stops Array (Source -> Waypoints -> Destination)
        const stops = [
            { name: req.body.source.name, lat: req.body.source.lat, lng: req.body.source.lng, stopIndex: 0 },
            ...(req.body.waypoints || []).map((wp, i) => ({ ...wp, stopIndex: i + 1 })),
            { name: req.body.destination.name, lat: req.body.destination.lat, lng: req.body.destination.lng, stopIndex: (req.body.waypoints?.length || 0) + 1 }
        ];

        rideData.stops = stops;

        // Initialize Segment Availability (10km Virtual Grid)
        let totalDistance = 0;
        if (req.body.routePath && req.body.routePath.coordinates) {
            const routeLine = turf.lineString(req.body.routePath.coordinates);
            totalDistance = turf.length(routeLine, { units: 'kilometers' });
        }

        // Default to a minimum if distance is 0 (shouldn't happen with valid route)
        // If calculated distance is 1200km, we need 120 segments of 10km each.
        // Initialize Segment Availability (10km Virtual Grid) with Objects for arrayFilters support
        const numSegments = Math.ceil((totalDistance || 100) / 10);
        rideData.segmentAvailability = Array.from({ length: numSegments }, (_, i) => ({
            index: i,
            seats: req.body.totalSeats
        }));

        console.log(`[GRID LOG] Created ride with ${numSegments} virtual units for ${totalDistance.toFixed(2)}km.`);

        // Calculate Total Distance & Rate Per KM
        if (req.body.routePath && req.body.routePath.coordinates) {
            const routeLine = turf.lineString(req.body.routePath.coordinates);
            rideData.totalDistance = totalDistance;
            rideData.ratePerKm = req.body.price / totalDistance; // Use the totalDistance calculated above
            console.log(`[Pricing] Dist: ${length.toFixed(2)}km, Rate: ₹${rideData.ratePerKm.toFixed(2)}/km`);
        } else {
            // Fallback if no routePath (shouldn't happen with new frontend)
            rideData.totalDistance = 0;
            rideData.ratePerKm = 0;
        }

        // console.log("Initialized Segments:", rideData.segmentAvailability);

        const createdRide = await createNewRide(rideData, req.user);

        res.status(201).json({
            success: true,
            ride: createdRide,
            message: 'Ride created successfully'
        });
    } catch (error) {
        console.error("Create Ride Error:", error);
        res.status(400).json({ message: 'Invalid ride data', error: error.message });
    }
};

// @desc    Confirm Ride Payment (Step 2: Activate Ride)
// @route   POST /api/rides/confirm-payment
// @access  Private
const confirmRidePayment = async (req, res) => {
    try {
        const { rideId, paymentId } = req.body;

        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ride.status === 'active') {
            return res.status(400).json({ message: 'Ride is already active' });
        }

        // Mock Verification
        if (!paymentId) {
            return res.status(400).json({ message: 'Payment ID missing' });
        }

        // Activate Ride
        ride.status = 'active';
        ride.isDepositPaid = true;
        // In real world, we would store paymentId as well
        await ride.save();

        res.json({ success: true, message: 'Payment confirmed, ride is now active', ride });

    } catch (error) {
        console.error("Payment Confirmation Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get rides created by logged-in driver
const getDriverRides = async (req, res) => {
    try {
        const rides = await Ride.find({ driver: req.user._id }).sort({ dateTime: -1 });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update ride (Date/Time only for now)
// @route   PUT /api/rides/:id
// @access  Private
const updateRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Restrict updates if bookings exist? Ideally yes, but for now simple update.
        // If changing time, should notify passengers. 
        // For MVP: Just allow update.

        if (req.body.dateTime) {
            ride.dateTime = req.body.dateTime;
        }

        // Explicitly NOT allowing price/route changes to avoid conflicts with existing bookings logic for now.

        const updatedRide = await ride.save();
        res.json(updatedRide);

    } catch (error) {
        console.error("Update Ride Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update ride status
// @route   PUT /api/rides/:id/status
// @access  Private
const updateRideStatus = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (ride) {
            if (ride.driver.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            ride.status = req.body.status || ride.status;
            const updatedRide = await ride.save();

            // Notify via Socket.io if status changed
            if (req.body.status === 'completed') {
                const io = req.app.get('io');
                if (io) {
                    io.to(ride._id.toString()).emit('ride_ended', { rideId: ride._id });
                    console.log(`Ride ${ride._id} ended. Notification sent.`);
                }
            }

            res.json(updatedRide);
        } else {
            res.status(404).json({ message: 'Ride not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete/Cancel ride
// @route   DELETE /api/rides/:id
// @access  Private
const deleteRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (ride) {
            if (ride.driver.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            // In a real app, we would check for active bookings and handle refunds/notifications
            await ride.deleteOne();

            // Auto-demote to user if no active rides left
            const activeRides = await Ride.countDocuments({ driver: req.user._id, status: 'active' });
            if (activeRides === 0) {
                await User.findByIdAndUpdate(req.user._id, { role: 'user' });
            }

            res.json({ message: 'Ride removed' });
        } else {
            res.status(404).json({ message: 'Ride not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Search rides
// @route   GET /api/rides/search
// @access  Public
const searchRides = async (req, res) => {
    try {
        const { source, destination, date, sourceLat, sourceLng, destLat, destLng, passengers } = req.query;
        console.log("Search Params:", { source, destination, sourceLat, sourceLng, destLat, destLng, passengers });

        // Allow rides that started up to 24 hours ago (for ongoing long journeys)
        const lookbackDate = new Date();
        lookbackDate.setHours(lookbackDate.getHours() - 24);

        let query = {
            dateTime: { $gte: lookbackDate },
            status: 'active',
            visibility: 'public',
            // availableSeats check removed to allow segment-based discovery
        };

        // Geospatial Search on Route Path
        if (sourceLat && sourceLng) {
            query = {
                ...query,
                routePath: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(sourceLng), parseFloat(sourceLat)]
                        },
                        $maxDistance: 20000 // 20km
                    }
                }
            };
        } else {
            // Fallback text search
            if (source) query['source.name'] = { $regex: source, $options: 'i' };
            if (destination) query['destination.name'] = { $regex: destination, $options: 'i' };
        }

        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(searchDate.getDate() + 1);
            query.dateTime = { $gte: searchDate, $lt: nextDay };
        }



        let rides = await Ride.find(query).populate('driver', 'name profilePicture isVerified vehicle gender age travelPreferences bio avgRating');

        // Post-Processing: Meeting Points & Virtual Grid Availability
        if (sourceLat && sourceLng && destLat && destLng) {
            const passengerSourcePoint = turf.point([parseFloat(sourceLng), parseFloat(sourceLat)]);
            const passengerDestPoint = turf.point([parseFloat(destLng), parseFloat(destLat)]);
            const requestedSeats = passengers ? parseInt(passengers) : 1;

            const validRides = [];

            console.log(`[Search] Found ${rides.length} potential rides via Geo Query.`);

            for (const doc of rides) {
                // Convert to plain object to allow property overrides
                const ride = doc.toObject();

                if (!ride.routePath || !ride.routePath.coordinates) {
                    console.log(`[Search] Ride ${ride._id} skipped: No route path.`);
                    continue;
                }



                // 1. Calculate Meeting Points
                const routeLine = turf.lineString(ride.routePath.coordinates);
                const pickupSnapped = turf.nearestPointOnLine(routeLine, passengerSourcePoint);
                const dropoffSnapped = turf.nearestPointOnLine(routeLine, passengerDestPoint);

                const distToPickupPoint = turf.distance(passengerSourcePoint, pickupSnapped, { units: 'kilometers' });
                const distToDropoffPoint = turf.distance(passengerDestPoint, dropoffSnapped, { units: 'kilometers' });

                console.log(`[Search] Ride ${ride._id}: PickupDist=${distToPickupPoint.toFixed(2)}km, DropoffDist=${distToDropoffPoint.toFixed(2)}km`);

                if (distToPickupPoint > 20 || distToDropoffPoint > 20) {
                    console.log(`[Search] Ride ${ride._id} skipped: Too far from route.`);
                    continue;
                }

                // 2. Virtual Grid Segment Logic
                const startPoint = turf.point(ride.routePath.coordinates[0]);
                const pickupSegmentLine = turf.lineSlice(startPoint, pickupSnapped, routeLine);
                const pickupDistFromStart = turf.length(pickupSegmentLine, { units: 'kilometers' });

                const dropoffSegmentLine = turf.lineSlice(startPoint, dropoffSnapped, routeLine);
                const dropoffDistFromStart = turf.length(dropoffSegmentLine, { units: 'kilometers' });

                console.log(`[Search] Ride ${ride._id}: PickupSeg=${pickupDistFromStart.toFixed(2)}, DropoffSeg=${dropoffDistFromStart.toFixed(2)}`);

                if (pickupDistFromStart >= dropoffDistFromStart) {
                    console.log(`[Search] Ride ${ride._id} skipped: Wrong direction.`);
                    continue;
                }

                const pickupGridIndex = Math.floor(pickupDistFromStart / 10);
                const dropoffGridIndex = Math.floor(dropoffDistFromStart / 10);

                // 3. Check Segment Availability
                let isSegmentAvailable = true;
                let minSegmentSeats = ride.totalSeats;

                const hasGrid = ride.segmentAvailability && ride.segmentAvailability.length > 0;

                if (hasGrid) {
                    const segmentRange = ride.segmentAvailability.slice(pickupGridIndex, dropoffGridIndex);
                    // Check if indices are valid
                    if (!segmentRange || segmentRange.length === 0) {
                        // This might happen if route is shorter than calculated distance?
                        // Log it
                        console.log(`[Search] Ride ${ride._id} warning: Empty segment range for indices ${pickupGridIndex}-${dropoffGridIndex}`);
                    }

                    for (const seg of segmentRange) {
                        const available = (typeof seg === 'number') ? seg : seg.seats;
                        if (available < requestedSeats) {
                            isSegmentAvailable = false;
                        }
                        if (available < minSegmentSeats) minSegmentSeats = available;
                    }
                } else {
                    // Legacy Fallback
                    if (ride.availableSeats < requestedSeats) isSegmentAvailable = false;
                    minSegmentSeats = ride.availableSeats;
                }

                // MARK FULL OR INSUFFICIENT SEATS
                ride.isFull = !isSegmentAvailable;

                // Ride Passed basic route checks! Attach Details
                ride.distanceToMeetingPoint = distToPickupPoint;
                ride.availableSeats = Math.max(0, minSegmentSeats);
                ride.pickupGridIndex = pickupGridIndex;
                ride.dropoffGridIndex = dropoffGridIndex;
                ride.pickupMeetingPoint = pickupSnapped.geometry;
                ride.dropoffMeetingPoint = dropoffSnapped.geometry;

                // Calculate Partial Price
                const travelDistance = dropoffDistFromStart - pickupDistFromStart;
                ride.segmentDistance = travelDistance;
                if (ride.ratePerKm) {
                    ride.estimatedPrice = Math.round(travelDistance * ride.ratePerKm);
                } else {
                    let totalDist = ride.totalDistance;
                    // Fallback if totalDistance is missing but route exists
                    if (!totalDist && ride.routePath) {
                        try {
                            totalDist = turf.length(turf.lineString(ride.routePath.coordinates), { units: 'kilometers' });
                        } catch (e) {
                            totalDist = travelDistance;
                        }
                    }
                    if (!totalDist) totalDist = travelDistance || 1;

                    ride.estimatedPrice = Math.round((travelDistance / totalDist) * ride.price);
                }

                // If the segment is nearly the full route (>95%), show full price
                if (ride.totalDistance && travelDistance >= ride.totalDistance * 0.95) {
                    ride.estimatedPrice = ride.price;
                }

                if (ride.estimatedPrice > ride.price) ride.estimatedPrice = ride.price;
                if (ride.estimatedPrice < 50) ride.estimatedPrice = 50;

                console.log(`[Search] Ride ${ride._id} MATCHED! Price: ${ride.estimatedPrice}`);
                validRides.push(ride);
            }

            // Calculate Ratings for ALL found rides

            // Calculate Ratings for ALL found rides
            const ridesWithRatings = await Promise.all(validRides.map(async (ride) => {
                if (ride.driver && ride.driver.avgRating !== undefined) return ride;
                const reviews = await Review.find({ reviewee: ride.driver._id });
                const avgRating = reviews.length > 0
                    ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
                    : 0;
                return { ...ride, driver: { ...ride.driver, avgRating } };
            }));

            return res.json(ridesWithRatings);
        }

        // Fallback for non-geo search
        res.json(rides);

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Join Waitlist
// @route   POST /api/rides/:id/waitlist
// @access  Private
const joinWaitlist = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Check if already in waitlist
        const alreadyJoined = ride.waitlist.some(w => w.user.toString() === req.user._id.toString());
        if (alreadyJoined) {
            return res.status(400).json({ message: 'Already in waitlist' });
        }

        // Check if driver
        if (ride.driver.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Driver cannot join waitlist' });
        }

        // Optional: Check if seats are actually full? 
        // Requirement says: "If seats = 0 -> Join Waitlist". 
        // But technically one can join even if seats > 0? No, usually only if full.
        if (ride.availableSeats > 0) {
            return res.status(400).json({ message: 'Seats are available, please book directly.' });
        }

        ride.waitlist.push({ user: req.user._id });
        await ride.save();

        res.json({ message: 'Joined waitlist', waitlist: ride.waitlist });

    } catch (error) {
        console.error("Waitlist Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get ride by ID
// @route   GET /api/rides/:id
// @access  Public (or Private depending on use)
const getRideById = async (req, res) => {
    try {
        // Populate driver details so frontend can show them
        const ride = await Ride.findById(req.params.id)
            .populate('driver', 'name phone profilePicture avgRating')
            .populate('vehicle');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Return full ride object
        res.json(ride);
    } catch (error) {
        console.error("Get Ride By ID Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export { createRide, getDriverRides, updateRideStatus, updateRide, deleteRide, searchRides, joinWaitlist, getRideById };
