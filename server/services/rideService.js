import Ride from '../models/Ride.js';
import User from '../models/User.js';

/**
 * Creates a new ride and updates the user role to driver if needed.
 * @param {Object} rideData - The data for the ride (source, dest, etc.)
 * @param {Object} user - The user creating the ride (req.user)
 * @returns {Promise<Object>} The created ride document
 */
export const createNewRide = async (rideData, user) => {
    const {
        source, destination, waypoints, dateTime, price, totalSeats, vehicle,
        routePolyline, bounds, routePath, visibility, communityId,
        stops, segmentAvailability, totalDistance, ratePerKm, status, isDepositPaid
    } = rideData;

    const ride = new Ride({
        driver: user._id,
        source,
        destination,
        waypoints,
        stops, // Added
        segmentAvailability, // Added
        totalDistance, // Added
        ratePerKm, // Added
        status, // Added
        isDepositPaid, // Added
        dateTime,
        price,
        totalSeats,
        availableSeats: totalSeats, // Initially available = total (offered) seats
        vehicle, // Includes capacity
        routePolyline,
        bounds,
        visibility,
        communityId,
        // Create GeoJSON objects
        sourceLocation: { type: 'Point', coordinates: [source.lng, source.lat] },
        destLocation: { type: 'Point', coordinates: [destination.lng, destination.lat] },
        routePath: {
            type: 'LineString',
            coordinates: (routePath && routePath.length >= 2)
                ? routePath
                : [[source.lng, source.lat], [destination.lng, destination.lat]]
        }
    });

    const createdRide = await ride.save();

    // Auto-promote user to driver if not already
    if (user.role !== 'driver') {
        await User.findByIdAndUpdate(user._id, { role: 'driver' });
    }

    return createdRide;
};
