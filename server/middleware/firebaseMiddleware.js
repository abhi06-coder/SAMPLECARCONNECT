import admin from '../config/firebaseAdmin.js';

const protectWithFirebase = async (req, res, next) => {
    const token = req.body.firebaseToken || req.headers['x-firebase-token'];

    if (!token) {
        return res.status(401).json({ message: 'Firebase Token Required for this Action' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.firebaseUser = decodedToken;
        next();
    } catch (error) {
        console.error('Firebase Token Verification Failed:', error);
        return res.status(403).json({ message: 'Invalid or Expired Firebase Token' });
    }
};

export { protectWithFirebase };
