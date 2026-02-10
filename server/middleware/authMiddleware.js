import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    token = req.cookies.jwt;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            console.error('Bearer Token Extract Error:', error);
        }
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Note: We allow blocked users to "authenticate" (e.g. to see profile or blocking status),
            // but specific routes should use 'restrictToActive' or check status explicitly.
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const restrictToActive = (req, res, next) => {
    if (req.user) {
        if (req.user.status === 'HARD_BLOCKED') {
            return res.status(403).json({
                message: 'Your account has been permanently blocked. Please contact support.'
            });
        }
        if (req.user.status === 'SOFT_BLOCKED') {
            if (req.user.blockedUntil && new Date() < new Date(req.user.blockedUntil)) {
                return res.status(403).json({
                    message: `Account blocked until ${new Date(req.user.blockedUntil).toLocaleDateString()}. Restricted access.`
                });
            }
        }
    }
    next();
};

export { protect, admin, restrictToActive };
