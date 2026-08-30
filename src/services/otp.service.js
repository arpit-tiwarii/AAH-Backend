const crypto = require('crypto');
const { DatabaseError } = require('../Error/DataBaseError');
const { ValidationError } = require('../Error/ValidationError');
const { AppError } = require('../Error/AppError');
const { findActiveOtpByUser, createOtpRepository, incrementOtpAttempts } = require('../repositories/Otp.repository');
const { findUserById, updateUserById } = require('../repositories/User.repository');
const { emailQueue } = require('../queues/email.queue');
const { OTP_PURPOSE } = require('../utils/constants');

// Maximum wrong guesses allowed against a single active OTP before it is
// burned and the user must request a fresh code.
const MAX_OTP_ATTEMPTS = 5;

function generateOTP() {
    return crypto.randomInt(0, 1000000)
        .toString()
        .padStart(6, '0');
}

const sendOtp = async ({ uid, otp, email, name, session }) => {
    if (!otp || !uid || !email || !name) {
        throw new AppError('OTP could not be generated', 503);
    }

    const otpResult = await createOtpRepository(
        otp,
        uid,
        session ? { session } : {},
        OTP_PURPOSE.EMAIL_VERIFICATION
    );
    if (!otpResult) {
        throw new DatabaseError('OTP was not created in database');
    }

    await emailQueue.add(
        'otp-email',
        {
            email,
            name,
            otp,
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

    return otpResult;
};

const createOtpService = async ({ userId, email, name, session }) => {
    const newOtp = generateOTP();
    const responseOtp = await sendOtp({ uid: userId, otp: newOtp, email, name, session });
    return { uid: responseOtp.UId };
};

// Public resend endpoint: the caller only supplies a user id. Recipient
// details are resolved from the database, never taken from the request body,
// so this endpoint cannot be used to send mail to arbitrary addresses.
const resendOtpService = async ({ uid }) => {
    const user = await findUserById(uid);
    if (!user) {
        throw new ValidationError('Unable to resend OTP for the provided account.');
    }
    if (user.verify) {
        throw new ValidationError('This account is already verified.');
    }
    return createOtpService({ userId: user.id, email: user.email, name: user.name });
};

const verifyOtpService = async ({ uid, otp }) => {
    const record = await findActiveOtpByUser(uid, OTP_PURPOSE.EMAIL_VERIFICATION);
    if (!record) {
        throw new ValidationError('This OTP has expired or was not found. Please request a new code.');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
        await record.softDelete();
        throw new ValidationError('Too many incorrect attempts. Please request a new code.');
    }

    if (record.otp !== String(otp)) {
        await incrementOtpAttempts(record.id);
        throw new ValidationError('Invalid OTP. Please enter the code sent to your email.');
    }

    await record.softDelete();
    await updateUserById(uid, { verify: true });

    return { message: 'OTP verified successfully. Your account Under Admin Review.' };
};

module.exports = {
    createOtpService,
    resendOtpService,
    verifyOtpService,
    // Shared with the password-reset flow so both OTP kinds use one generator
    // and one attempt cap.
    generateOTP,
    MAX_OTP_ATTEMPTS,
};
