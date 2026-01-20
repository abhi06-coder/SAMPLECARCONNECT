import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const sendSMS = async ({ numbers, message }) => {
    if (!process.env.FAST2SMS_API_KEY) {
        console.warn('[SMS] FAST2SMS_API_KEY not found. SMS simulated.');
        console.log(`[SMS Simulation] To: ${numbers}, Message: "${message}"`);
        return { success: true, simulated: true };
    }

    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            route: 'q',
            message: message,
            numbers: String(numbers),
        }, {
            headers: {
                "authorization": process.env.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
        });

        console.log(`[SMS] Sent to ${numbers}: ${message.substring(0, 50)}...`);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('[SMS] Failed:', error.message);
        if (error.response) {
            console.error('[SMS] Error Data:', JSON.stringify(error.response.data));
        }
        // Do not throw error to avoid crashing the server
        return { success: false, error: error.message };
    }
};
