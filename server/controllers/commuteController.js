import CommuteTemplate from '../models/CommuteTemplate.js';
import Ride from '../models/Ride.js';
import { createNewRide } from '../services/rideService.js';

// @desc    Create a new commute template
// @route   POST /api/commute/create
// @access  Private
export const createTemplate = async (req, res) => {
    try {
        const { source, destination, time, daysOfWeek, price, totalSeats, vehicle, routePolyline, bounds, routePath, visibility, communityId } = req.body;

        const template = new CommuteTemplate({
            driver: req.user._id,
            source,
            destination,
            time,
            daysOfWeek,
            price,
            totalSeats,
            vehicle,
            routePolyline,
            bounds,
            routePath,
            visibility,
            communityId
        });

        const createdTemplate = await template.save();
        res.status(201).json(createdTemplate);
    } catch (error) {
        res.status(400).json({ message: 'Invalid template data', error: error.message });
    }
};

// @desc    Get all templates for logged-in driver
// @route   GET /api/commute/list
// @access  Private
export const getMyTemplates = async (req, res) => {
    try {
        const templates = await CommuteTemplate.find({ driver: req.user._id });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Check if there is a pending commute for TODAY
// @route   GET /api/commute/check-pending
// @access  Private
export const checkPendingCommute = async (req, res) => {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0-6

        // Find active templates for THIS day
        const templates = await CommuteTemplate.find({
            driver: req.user._id,
            isActive: true,
            daysOfWeek: dayOfWeek
        });

        if (templates.length === 0) {
            return res.json({ pending: false });
        }

        // For each matching template, check if a ride already exists for today
        // We define "Same Ride" as: Same Driver, Same Source/Dest Names, Same Date (ignoring time slightly or exact date match)
        // Actually, we just check if a ride exists for today roughly matching the template time.

        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const existingRides = await Ride.find({
            driver: req.user._id,
            dateTime: { $gte: startOfDay, $lte: endOfDay }
        });

        // Filter templates that don't have a corresponding ride
        const pendingTemplates = templates.filter(template => {
            // Check if any existing ride matches this template's basic info
            // Simple check: Is there a ride today? 
            // Better check: Is there a ride with same Source/Dest?
            const alreadyCreated = existingRides.some(ride =>
                ride.source.name === template.source.name &&
                ride.destination.name === template.destination.name
            );
            return !alreadyCreated;
        });

        if (pendingTemplates.length > 0) {
            // Return the first pending one for the Alert
            return res.json({ pending: true, template: pendingTemplates[0] });
        }

        res.json({ pending: false });

    } catch (error) {
        console.error("Check Pending Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Publish a ride from a template
// @route   POST /api/commute/publish/:id
// @access  Private
export const publishCommute = async (req, res) => {
    try {
        const template = await CommuteTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        if (template.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Construct Date object for Today + Template Time
        const [hours, minutes] = template.time.split(':').map(Number);
        const rideDate = new Date();
        rideDate.setHours(hours, minutes, 0, 0);

        // If time has already passed for today, maybe schedule for tomorrow? 
        // For now, let's assume it's for today even if slightly fast. 
        // Or if user wants, we could pass a dateOverride.
        // Requirement: "One-Tap Publish" implies "Today". 

        // Check if time passed?
        if (rideDate < new Date()) {
            // If late, still allow? Yes, maybe they are leaving late.
            // Just warn? We'll proceed.
        }

        // Prepare ride data from template
        const rideData = {
            source: template.source,
            destination: template.destination,
            waypoints: [], // Template doesn't store waypoints yet, or we could add
            dateTime: rideDate,
            price: template.price,
            totalSeats: template.totalSeats,
            vehicle: template.vehicle,
            routePolyline: template.routePolyline,
            bounds: template.bounds,
            routePath: template.routePath,
            visibility: template.visibility,
            communityId: template.communityId
        };

        const createdRide = await createNewRide(rideData, req.user);
        res.status(201).json(createdRide);

    } catch (error) {
        console.error("Publish Commute Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
