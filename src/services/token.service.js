const JWT = require('jsonwebtoken');
const { config } = require('../env');

const generateToken = (user) => {
    const secret = config.auth.jwtSecret;
    const expiresIn = config.auth.jwtExpiresIn;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    const payload = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
    };

    const token = JWT.sign(payload, secret, {
        expiresIn,
        issuer: 'aarambh-athletics-hub',
    });

    return { token, expiresIn };
};

module.exports = { generateToken };