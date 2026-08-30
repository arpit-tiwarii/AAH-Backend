const bcrypt = require('bcryptjs');
const { ValidationError } = require('../Error/ValidationError');
const { DatabaseError } = require('../Error/DataBaseError');
const { InternalServerError } = require('../Error/InternalServerError');
const { findUserByEmail, updateUserById } = require('../repositories/User.repository');
const {
    createOtpRepository,
    findActiveOtpByUser,
    incrementOtpAttempts,
} = require('../repositories/Otp.repository');
const { generateOTP, MAX_OTP_ATTEMPTS } = require('./otp.service');
const { emailQueue } = require('../queues/email.queue');
const { OTP_PURPOSE } = require('../utils/constants');
const {
    validatePasswordStrength,
    hashPassword,
    PASSWORD_POLICY_MESSAGE,
} = require('../utils/password.util');
const { logger } = require('../utils/logger');

const EMAIL_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: true,
};

// Returned whether or not the address is registered. Any observable difference
// here — a different message, status code or error — turns this endpoint into
// an account-enumeration oracle.
const GENERIC_REQUEST_MESSAGE =
    'If an account exists for that email, a password reset code has been sent.';

// One message for "no such account", "no active code" and "wrong code", for the
// same reason.
const INVALID_CODE_MESSAGE =
    'That reset code is invalid or has expired. Please request a new one.';

// @desc    Start a password reset: issue a PASSWORD_RESET OTP and email it
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordResetService = async ({ email }) => {
    try {
        if (!email) {
            throw new ValidationError('Email is required.');
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            logger.info(
                { email: normalizedEmail },
                'Password reset requested for an unregistered email'
            );
            return { message: GENERIC_REQUEST_MESSAGE };
        }

        const otp = generateOTP();

        // Purpose-scoped: this replaces any earlier reset code but leaves a
        // pending email-verification code intact.
        const record = await createOtpRepository(
            otp,
            user.id,
            {},
            OTP_PURPOSE.PASSWORD_RESET
        );
        if (!record) {
            throw new DatabaseError('Reset code could not be created.');
        }

        // The code travels by email only — it is never part of the response.
        await emailQueue.add(
            'password-reset-otp-email',
            {
                email: user.email,
                name: user.name,
                otp,
            },
            EMAIL_JOB_OPTIONS
        );

        return { message: GENERIC_REQUEST_MESSAGE };
    } catch (error) {
        if (error && error.isOperational) {
            throw error;
        }

        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

// @desc    Finish a password reset: verify the OTP, then set the new password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPasswordService = async ({ email, otp, password }) => {
    try {
        if (!email || !otp || !password) {
            throw new ValidationError('Email, reset code and new password are required.');
        }

        // Checked before the code so a weak password never burns an attempt.
        if (!validatePasswordStrength(password)) {
            throw new ValidationError(PASSWORD_POLICY_MESSAGE);
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await findUserByEmail(normalizedEmail);
        if (!user) {
            throw new ValidationError(INVALID_CODE_MESSAGE);
        }

        const record = await findActiveOtpByUser(user.id, OTP_PURPOSE.PASSWORD_RESET);
        if (!record) {
            throw new ValidationError(INVALID_CODE_MESSAGE);
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await record.softDelete();
            throw new ValidationError(
                'Too many incorrect attempts. Please request a new reset code.'
            );
        }

        if (record.otp !== String(otp)) {
            await incrementOtpAttempts(record.id);
            throw new ValidationError(INVALID_CODE_MESSAGE);
        }

        // Reusing the current password would leave a compromised credential in
        // place while looking to the user like a successful rotation.
        if (user.password && (await bcrypt.compare(password, user.password))) {
            throw new ValidationError(
                'Your new password must be different from your current password.'
            );
        }

        const hashed = await hashPassword(password);
        const updated = await updateUserById(user.id, {
            password: hashed,
            // Invalidates every JWT issued before now (see authMiddleware).
            passwordChangedAt: new Date(),
        });
        if (!updated) {
            throw new DatabaseError('Password could not be updated.');
        }

        // Burn the code only after the new password is persisted, so a failed
        // write leaves the user able to retry with the same code.
        await record.softDelete();

        // Best effort: the reset has already succeeded, so a Redis or SMTP
        // outage must not surface to the user as a failed reset.
        try {
            await emailQueue.add(
                'password-changed-email',
                {
                    email: user.email,
                    name: user.name,
                },
                EMAIL_JOB_OPTIONS
            );
        } catch (queueError) {
            logger.error(
                { err: queueError?.message, userId: user.id },
                'Password reset succeeded but the confirmation email could not be queued'
            );
        }

        logger.info({ userId: user.id }, 'Password reset completed');

        return { message: 'Password reset successfully. Please log in with your new password.' };
    } catch (error) {
        if (error && error.isOperational) {
            throw error;
        }

        throw new InternalServerError(`Server error, error: ${error.message}`);
    }
};

module.exports = { requestPasswordResetService, resetPasswordService };
