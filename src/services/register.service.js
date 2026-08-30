const { DatabaseError } = require('../Error/DataBaseError');
const { ValidationError } = require('../Error/ValidationError');
const bcrypt = require('bcryptjs');
const { config } = require('../env');

const { findUserByEmail, createUser } = require('../repositories/User.repository');
const { ALLOWED_SPORTS } = require('../utils/constants');
const { validatePasswordStrength, PASSWORD_POLICY_MESSAGE } = require('../utils/password.util');
const { createOtpService } = require('./otp.service.js');
const { emailQueue } = require('../queues/email.queue');
const { mongoose } = require('../config/db.js');
const { isReplicaSetReady } = require('../models/model.utils');

// @desc    Register a new athlete
// @route   POST /api/athletes
// @access  Public
async function registerUser({ name, email, password, age, sports, contact, school, afiId, aadhar }) {
    try {
        if (!name || !email || !password || !age || !sports || !contact || !school || !afiId || !aadhar) {
            throw new ValidationError('All fields are required');
        }

        if (!validatePasswordStrength(password)) {
            throw new ValidationError(PASSWORD_POLICY_MESSAGE);
        }

        if (!ALLOWED_SPORTS.includes(sports)) {
            throw new ValidationError('Invalid sport value');
        }

        const normalizedAfiId = String(afiId).trim();
        if (!normalizedAfiId) {
            throw new ValidationError('AFI ID is required.');
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const userExists = await findUserByEmail(normalizedEmail);
        if (userExists) {
            throw new ValidationError('Unable to create an account with the provided details.');
        }

        const hashPassword = await bcrypt.hash(
            password,
            config.auth.passwordSaltRounds
        );

        let user;
        let otpResult;

        if (await isReplicaSetReady()) {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    user = await createUser({
                        name,
                        email,
                        password: hashPassword,
                        role: 'ATHLETE',
                        age,
                        sports,
                        contact,
                        afiId: normalizedAfiId,
                        school,
                        aadhar
                    }, { session });

                    if (!user) {
                        throw new DatabaseError('user not created.');
                    }

                    otpResult = await createOtpService({
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        session,
                    });
                });
            } finally {
                await session.endSession();
            }
        } else {
            user = await createUser({
                name,
                email,
                password: hashPassword,
                role: 'ATHLETE',
                age,
                sports,
                contact,
                afiId: normalizedAfiId,
                school,
                aadhar
            });

            if (!user) {
                throw new DatabaseError('user not created.');
            }

            otpResult = await createOtpService({
                userId: user.id,
                email: user.email,
                name: user.name,
            });
        }

        await emailQueue.add(
            'welcome-email',
            {
                email: user.email,
                name: user.name,
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
            }
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            uid: otpResult.uid,
        };

    } catch (error) {
        if (error && error.isOperational) {
            throw error;
        }
        const { InternalServerError } = require('../Error/InternalServerError');
        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

module.exports = { registerUser }
