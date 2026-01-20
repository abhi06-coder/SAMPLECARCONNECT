
import cron from 'node-cron';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import { sendSMS } from '../services/smsService.js';

export const checkAndSendReminders = async () => {
    console.log("Running Ride Reminder Job at", new Date().toISOString());

    try {
        const now = new Date();
        const windowStart = new Date(now.getTime() + 30 * 60000); // 30 mins from now
        const windowEnd = new Date(now.getTime() + 40 * 60000); // 40 mins from now

        // Find active rides departing in 30-40 mins that haven't sent reminders
        const upcomingRides = await Ride.find({
            dateTime: { $gte: windowStart, $lte: windowEnd },
            status: 'active',
            reminderSent: false,
        }).populate('driver', 'name phone');

        console.log(`Found ${upcomingRides.length} rides for reminders.`);

        for (const ride of upcomingRides) {
            // Get confirmed passengers
            const bookings = await Booking.find({ ride: ride._id, status: 'confirmed' }).populate('passenger', 'name phone');
            const passengers = bookings.map(b => b.passenger);

            if (passengers.length === 0) continue;

            // Send SMS to Passengers
            const passengerPhones = passengers.map(p => p.phone).filter(Boolean).join(',');
            if (passengerPhones) {
                await sendSMS({
                    numbers: passengerPhones,
                    message: `Reminder: Ride to ${ride.destination.name} departs at ${new Date(ride.dateTime).toLocaleTimeString()}. Driver: ${ride.driver.name}.`
                });
            }

            // Send SMS to Driver
            if (ride.driver.phone) {
                await sendSMS({
                    numbers: ride.driver.phone,
                    message: `Reminder: Your ride to ${ride.destination.name} departs in 30 mins. ${passengers.length} passenger(s) confirmed.`
                });
            }

            // Mark reminder as sent
            ride.reminderSent = true;
            await ride.save();
            console.log(`Reminders sent for ride ${ride._id}`);
        }

    } catch (error) {
        console.error("Error in Reminder Cron:", error);
    }
};

export const initScheduler = () => {
    console.log("Initializing Reminder Cron Job...");

    // Run every 1 minute for testing (Revert to */10 in production)
    cron.schedule('* * * * *', async () => {
        await checkAndSendReminders();
    });
};
