import Booking from '../models/Booking.js';
import Ride from '../models/Ride.js';
import { sendSMS } from '../services/smsService.js';

// @desc    Book a ride
// @route   POST /api/bookings/book
// @access  Private
// @desc    Book a ride
// @route   POST /api/bookings/book
// @access  Private
const bookRide = async (req, res) => {
    try {
        const { rideId, seatsBooked, meetingPoint, distanceToMeetingPoint, pickupIndex, dropoffIndex, pickupGridIndex, dropoffGridIndex } = req.body;

        // Determine which indices to use (Grid vs Stop-based legacy)
        // New frontend sends pickupGridIndex/dropoffGridIndex.
        const useGrid = pickupGridIndex !== undefined && dropoffGridIndex !== undefined;

        console.log(`[Booking] Processing booking for Ride ${rideId}. Grid Mode: ${useGrid}`);

        if (useGrid && pickupGridIndex >= dropoffGridIndex) {
            return res.status(400).json({ message: 'Invalid Route Segments' });
        }

        if (seatsBooked <= 0) {
            return res.status(400).json({ message: 'Seats booked must be greater than 0' });
        }

        // SEGMENT-BASED SEAT LOCKING
        let updateQuery;
        let updateOptions = { new: true };

        if (useGrid) {
            // New 10km Grid Logic (Object based)
            // Decrement seats for segments where 'index' is between pickup and dropoff
            updateQuery = {
                $inc: {
                    "segmentAvailability.$[elem].seats": -seatsBooked, // Update the 'seats' property of the matched element
                    // "availableSeats": -seatsBooked  <-- REMOVED: Global seats should NOT decrease for segment bookings
                }
            };
            // Filter elements where elem.index is in range
            updateOptions.arrayFilters = [{ "elem.index": { $gte: pickupGridIndex, $lt: dropoffGridIndex } }];
        } else {
            // Legacy Stop-based Logic (Fallback)
            // Just decrement global seats.
            console.log(`[Booking] Legacy Mode for Ride ${rideId}`);
            updateQuery = { $inc: { availableSeats: -seatsBooked } };
            // specific filter not needed for global update, but findOneAndUpdate needs a query
            // We'll just match by ID and ensuring availableSeats >= booked
        }

        // 1. Check availability FIRST (Optional but good for error msg)
        // 2. Atomic Update

        let ride;

        if (useGrid) {
            ride = await Ride.findOneAndUpdate(
                {
                    _id: rideId,
                    // Optimistic check? We rely on arrayFilters to not update if not matching?
                    // actually findOneAndUpdate returns result. If we want to ensure it only updates if valid:
                    // We can't easily do "all segments > seats" in query.
                    // But we can check after, or rely on the UI/Search check + hope.
                },
                updateQuery,
                {
                    new: true,
                    arrayFilters: [{ "elem.index": { $gte: pickupGridIndex, $lt: dropoffGridIndex } }]
                }
            );
        } else {
            // Legacy Update
            ride = await Ride.findOneAndUpdate(
                {
                    _id: rideId,
                    availableSeats: { $gte: seatsBooked }
                },
                updateQuery,
                { new: true }
            );
        }

        if (!ride) {
            return res.status(400).json({ message: 'Ride not found or not enough seats available.' });
        }

        // POST-UPDATE VALIDATION (Cheaper than complex query)
        // Check if any segment or global availability went below 0
        const segmentParams = ride.segmentAvailability.slice(pickupGridIndex, dropoffGridIndex);
        const hasOverbooking = segmentParams.some(seg => {
            const seats = (typeof seg === 'number') ? seg : seg.seats;
            return seats < 0;
        }); // REMOVED: || ride.availableSeats < 0 (Global seats don't matter for grid)

        if (hasOverbooking) {
            // Rollback!
            await Ride.findByIdAndUpdate(
                rideId,
                {
                    $inc: {
                        "segmentAvailability.$[elem].seats": seatsBooked,
                        // "availableSeats": seatsBooked <-- REMOVED: No global rollback needed if not decremented
                    }
                },
                { arrayFilters: [{ "elem.index": { $gte: pickupGridIndex, $lt: dropoffGridIndex } }] }
            );
            return res.status(400).json({ message: 'One or more segments are fully booked.' });
        }

        // Prevent booking own ride
        if (ride.driver.toString() === req.user._id.toString()) {
            // Rollback
            await Ride.findByIdAndUpdate(
                rideId,
                { $inc: { "segmentAvailability.$[elem].seats": seatsBooked } },
                { arrayFilters: [{ "elem.index": { $gte: pickupGridIndex, $lt: dropoffGridIndex } }] }
            );
            return res.status(400).json({ message: 'Cannot book your own ride' });
        }

        // Price Calculation (Server-Side)
        let finalUnitPrice = ride.price; // Default to base price

        if (useGrid && ride.ratePerKm) {
            // Calculate distance based on grid segments (1 segment = 10km approximation)
            const segmentDistance = (dropoffGridIndex - pickupGridIndex) * 10;
            finalUnitPrice = segmentDistance * ride.ratePerKm;
        }

        // 1. Razorpay Simulation
        console.log(`[RAZORPAY] Initializing partial payment for ₹${finalUnitPrice * seatsBooked}`);

        // 2. Fast2SMS Simulation
        const meetCoords = meetingPoint ? `${meetingPoint.coordinates[1]}, ${meetingPoint.coordinates[0]}` : 'Highway';
        console.log(`[FAST2SMS] Booking Confirmed! Meet at: ${meetCoords}`);


        // Generate 6-digit OTP
        const endRideOtp = Math.floor(100000 + Math.random() * 900000).toString();

        const booking = new Booking({
            ride: rideId,
            passenger: req.user._id,
            seatsBooked,
            totalPrice: finalUnitPrice * seatsBooked, // Server-calculated price
            status: 'pending_approval',
            meetingPoint,
            distanceToMeetingPoint,
            paymentMode: req.body.paymentMode || 'online',
            pickupGridIndex,
            dropoffGridIndex,
            pickupName: req.body.pickupName,
            dropoffName: req.body.dropoffName,
            endRideOtp
        });

        const createdBooking = await booking.save();

        // Notify Driver via Socket
        const io = req.app.get('io');
        if (io) {
            io.to(ride.driver.toString()).emit('ride_request', {
                message: 'New Ride Request!',
                bookingId: createdBooking._id,
                passengerName: req.user.name
            });
        }

        res.status(201).json(createdBooking);
    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ passenger: req.user._id })
            .populate({
                path: 'ride',
                populate: { path: 'driver', select: 'name phone profilePicture' }
            })
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Process Payment / Confirm Payment Mode
// @route   PUT /api/bookings/:id/pay
// @access  Private
const processPayment = async (req, res) => {
    try {
        const { paymentMode } = req.body; // 'online' or 'cash'
        const booking = await Booking.findById(req.params.id);

        if (booking) {
            if (booking.passenger.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            if (paymentMode === 'cash') {
                booking.paymentMode = 'cash';
                booking.paymentStatus = 'pending'; // Still pending until actually paid to driver
                booking.status = 'confirmed'; // Confirmed by driver, accepted by passenger (cash promised)
            } else {
                // Online Payment (Mock)
                booking.paymentMode = 'online';
                booking.paymentStatus = 'paid';
                booking.status = 'confirmed';
            }

            const updatedBooking = await booking.save();
            res.json(updatedBooking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get bookings for driver's rides
// @route   GET /api/bookings/driver-requests
// @access  Private
// @desc    Get bookings for driver's rides
// @route   GET /api/bookings/driver-requests
// @access  Private
const getDriverBookings = async (req, res) => {
    try {
        // Find all rides by this driver
        const rides = await Ride.find({ driver: req.user._id });
        const rideIds = rides.map(ride => ride._id);

        // Find bookings for these rides
        const bookings = await Booking.find({ ride: { $in: rideIds } })
            .populate('passenger', 'name email phone age gender profilePicture travelPreferences') // Added travelPreferences
            .populate('ride', 'source destination dateTime')
            .sort({ createdAt: -1 });

        // Calculate Ratings for each passenger
        // NOTE: In a real app at scale, this should be aggregated or stored on User model.
        // For this task, we will fetch reviews for each passenger manually.
        const bookingsWithRatings = await Promise.all(bookings.map(async (booking) => {
            // We need to import Review model dynamically or ensure it is imported at top
            const Review = (await import('../models/Review.js')).default;
            const reviews = await Review.find({ reviewee: booking.passenger._id });
            const avgRating = reviews.length > 0
                ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
                : 0; // Default to 0 or 'New'

            return {
                ...booking.toObject(),
                passenger: {
                    ...booking.passenger.toObject(),
                    avgRating
                }
            };
        }));

        res.json(bookingsWithRatings);
    } catch (error) {
        console.error("Get Driver Bookings Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update booking status (Approve/Reject)
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'confirmed' or 'cancelled' (rejected)
        const booking = await Booking.findById(req.params.id).populate('ride');

        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }

        const isDriver = booking.ride.driver.toString() === req.user._id.toString();
        const isPassenger = booking.passenger.toString() === req.user._id.toString();

        // Verify authorization
        if (!isDriver && !isPassenger) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        // Passengers can only cancel
        if (isPassenger && status !== 'cancelled') {
            res.status(403).json({ message: 'Passengers can only cancel bookings' });
            return;
        }

        if (status === 'cancelled' && booking.status !== 'cancelled') {
            // If rejecting/cancelling, restore seats
            // Check if it was a Grid Booking or Legacy
            if (booking.pickupGridIndex !== undefined && booking.dropoffGridIndex !== undefined) {
                // Restore to Grid
                await Ride.updateOne(
                    { _id: booking.ride._id },
                    {
                        $inc: {
                            "segmentAvailability.$[elem].seats": booking.seatsBooked,
                            // "availableSeats": booking.seatsBooked // REMOVED: Global seats were not decremented, so don't increment
                        }
                    },
                    {
                        arrayFilters: [{ "elem.index": { $gte: booking.pickupGridIndex, $lt: booking.dropoffGridIndex } }]
                    }
                );
            } else {
                // Legacy Restore
                await Ride.findByIdAndUpdate(booking.ride._id, {
                    $inc: { availableSeats: booking.seatsBooked }
                });
            }

            // Fetch ride to check waitlist (optional, but good for notification)
            const ride = await Ride.findById(booking.ride._id).populate('waitlist.user', 'name phone');

            // NOTIFY WAITLIST
            if (ride && ride.waitlist && ride.waitlist.length > 0) {
                const waitlistPhones = ride.waitlist.map(w => w.user.phone).filter(Boolean).join(',');
                if (waitlistPhones) {
                    try {
                        const message = `Good news! A seat is available for your ride to ${ride.destination.name}. Book now!`;
                        await sendSMS({ numbers: waitlistPhones, message }); // Assuming sendSMS is imported or available
                        console.log(`[Waitlist] Notified ${ride.waitlist.length} users.`);
                    } catch (smsErr) {
                        console.error("[Waitlist] SMS Failed:", smsErr);
                    }
                }
            }
        }

        booking.status = status;
        const updatedBooking = await booking.save();

        // Socket Notification
        const io = req.app.get('io');
        if (io) {
            if (isDriver) {
                // Driver cancelled/updated -> Notify Passenger
                io.to(booking.passenger.toString()).emit('booking_status', {
                    status: status,
                    booking: updatedBooking,
                    message: status === 'confirmed' ? 'Ride accepted! Please pay deposit.' : 'Ride request rejected.'
                });
            } else if (isPassenger) {
                // Passenger cancelled -> Notify Driver
                io.to(booking.ride.driver.toString()).emit('booking_cancelled', {
                    bookingId: booking._id,
                    message: 'A passenger has cancelled their booking.',
                    passengerName: req.user.name
                });
            }
        }

        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get bookings for a specific ride (Driver View)
// @route   GET /api/bookings/ride/:rideId
// @access  Private
const getRideBookings = async (req, res) => {
    try {
        const { rideId } = req.params;

        // Verify ownership
        const ride = await Ride.findOne({ _id: rideId, driver: req.user._id });
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found or unauthorized' });
        }

        const bookings = await Booking.find({ ride: rideId })
            .populate('passenger', 'name email phone age gender profilePicture travelPreferences')
            .sort({ createdAt: -1 });

        // Calculate Ratings (similar to getDriverBookings)
        const bookingsWithRatings = await Promise.all(bookings.map(async (booking) => {
            const Review = (await import('../models/Review.js')).default;
            const reviews = await Review.find({ reviewee: booking.passenger._id });
            const avgRating = reviews.length > 0
                ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
                : 0;

            return {
                ...booking.toObject(),
                passenger: {
                    ...booking.passenger.toObject(),
                    avgRating
                }
            };
        }));

        res.json(bookingsWithRatings);
    } catch (error) {
        console.error("Get Ride Bookings Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Complete a booking (Driver enters OTP)
// @route   PUT /api/bookings/:id/complete
// @access  Private
const completeBooking = async (req, res) => {
    try {
        const { otp } = req.body;
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'ride',
                populate: { path: 'driver', select: 'name profilePicture' }
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify Driver
        // Note: driver is fully populated now, so we must access ._id
        if (booking.ride.driver._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized. Only the driver can complete the ride.' });
        }

        // Verify OTP
        if (booking.endRideOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please ask the passenger for the correct code.' });
        }

        booking.status = 'completion_pending';
        // Ensure payment status is paid if it was cash? 
        if (booking.paymentMode === 'cash') {
            booking.paymentStatus = 'paid';
        }

        await booking.save();

        // Notify Passenger to confirm completion
        const io = req.app.get('io');
        if (io) {
            io.to(booking.passenger.toString()).emit('completion_requested', {
                bookingId: booking._id,
                message: 'Driver has verified OTP. Please confirm you have reached your destination.',
                rideId: booking.ride._id
            });
        }

        res.json({ success: true, message: 'OTP verified. Waiting for passenger confirmation.', booking });

    } catch (error) {
        console.error("Complete Booking Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Passenger confirms ride completion
// @route   POST /api/bookings/:id/confirm-completion
// @access  Private (Passenger only)
const confirmBookingCompletion = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'ride',
            populate: { path: 'driver', select: 'name profilePicture' }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify Passenger
        if (booking.passenger.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized. Only the passenger can confirm completion.' });
        }

        if (booking.status !== 'completion_pending') {
            return res.status(400).json({ message: 'Ride completion has not been requested by the driver yet.' });
        }

        booking.status = 'completed';
        await booking.save();

        // Notify both parties (final completion)
        const io = req.app.get('io');
        if (io) {
            // Notify Passenger (trigger rating modal for driver)
            io.to(booking.passenger.toString()).emit('booking_completed', {
                bookingId: booking._id,
                message: 'Ride completed! Please rate your driver.',
                rideId: booking.ride._id,
                driverId: booking.ride.driver
            });

            // Notify Driver (trigger rating modal for passenger)
            io.to(booking.ride.driver._id.toString()).emit('booking_confirmed_by_passenger', {
                bookingId: booking._id,
                message: 'Passenger confirmed completion. You can now rate them.',
                rideId: booking.ride._id
            });
        }

        res.json({ success: true, message: 'Ride completed and confirmed!', booking });

    } catch (error) {
        console.error("Confirm Completion Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export { bookRide, getMyBookings, processPayment, getDriverBookings, updateBookingStatus, getRideBookings, completeBooking, confirmBookingCompletion };
