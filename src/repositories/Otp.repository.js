const mongoose = require('mongoose');
const { OTP } = require("../models/otp.model");
const { OTP_PURPOSE } = require('../utils/constants');

// How long a freshly issued OTP remains valid.
const OTP_TTL_SECONDS = 10 * 60;

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// OTPs issued before `purpose` existed have no such field. Treat those legacy
// documents as email-verification codes so a code sent moments before a deploy
// still works, without ever letting them satisfy a password reset.
const purposeFilter = (purpose) =>
    purpose === OTP_PURPOSE.EMAIL_VERIFICATION
        ? { $or: [{ purpose }, { purpose: { $exists: false } }] }
        : { purpose };

const createOtpRepository = async (
    newotp,
    uid,
    options = {},
    purpose = OTP_PURPOSE.EMAIL_VERIFICATION
) => {
    // Invalidate any prior active OTPs for this user *and purpose* so only the
    // newest code of that kind can verify, while leaving a pending code of the
    // other kind alone. Runs inside the caller's transaction when provided.
    await OTP.updateMany(
        { UId: uid, deletedAt: null, ...purposeFilter(purpose) },
        { $set: { deletedAt: new Date() } },
        options
    );

    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
    const [otp] = await OTP.create([{ otp: newotp, UId: uid, purpose, expiresAt }], options);
    return otp;
};

// Returns the user's newest still-valid OTP for the given purpose (not
// soft-deleted, not expired), regardless of the submitted code — the service
// compares the value itself so it can enforce an attempt cap on wrong guesses.
const findActiveOtpByUser = async (uid, purpose = OTP_PURPOSE.EMAIL_VERIFICATION) => {
    if (!isValidId(uid)) return null;
    return await OTP.findOne({
        UId: uid,
        expiresAt: { $gt: new Date() },
        ...purposeFilter(purpose),
    }).sort({ createdAt: -1 });
};

const incrementOtpAttempts = async (id) => {
    if (!isValidId(id)) return null;
    return await OTP.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });
};

module.exports = { createOtpRepository, findActiveOtpByUser, incrementOtpAttempts, OTP_TTL_SECONDS };
