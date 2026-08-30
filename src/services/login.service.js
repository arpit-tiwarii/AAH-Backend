const { findUserByEmail } = require('../repositories/User.repository');
const { NotFoundError } = require('../Error/NotFoundError');
const { Authentication } = require('../Error/AuthenticationError');
const { ValidationError } = require('../Error/ValidationError');
const { generateToken } = require('./token.service');
const { InternalServerError } = require('../Error/InternalServerError');
const bcrypt = require('bcryptjs');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async ({ email, password }) => {
    try {
        if (!email || !password) {
            throw new ValidationError('Email and password are required.');
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await findUserByEmail(normalizedEmail);
        if (!user) {
            throw new NotFoundError('Invalid email or password.');
        }

        const normalizedRole = String(user.role || '').toUpperCase();
        const normalizedStatus = String(user.status || '').toUpperCase();

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Authentication('Invalid email or password.');
        }

        if (normalizedRole === 'ATHLETE') {
            if (normalizedStatus === 'PENDING') {
                throw new ValidationError('Account is pending admin approval. Please wait for approval.');
            }
            if (normalizedStatus === 'REJECTED') {
                throw new ValidationError('Your account has been rejected. Please contact admin.');
            }
        }

        const token = generateToken({
            id: user.id,
            name: user.name,
            role: normalizedRole,
            email: user.email,
        });

        return {
            ...token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: normalizedRole,
                status: normalizedStatus,
            },
        };
    } catch (error) {
        if (error && error.isOperational) {
            throw error;
        }

        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

module.exports = { loginUser };
