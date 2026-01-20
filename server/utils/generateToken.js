import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: isProduction, // Use secure cookies in production OR on Render
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site (Render subdomains), 'lax' for local
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export default generateToken;
