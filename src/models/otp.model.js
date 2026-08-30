const mongoose = require('mongoose');
const { baseSchemaOptions, withSoftDelete } = require('./model.utils');
const { OTP_PURPOSE } = require('../utils/constants');

const otpSchema = new mongoose.Schema(
    {
        UId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            default: null,
        },
        otp: {
            type: String,
            trim: true,
            required: true,
        },
        // What this code authorises. Lookups are always purpose-scoped, so a
        // password-reset code cannot be submitted to the email-verification
        // endpoint and vice versa.
        purpose: {
            type: String,
            enum: Object.values(OTP_PURPOSE),
            default: OTP_PURPOSE.EMAIL_VERIFICATION,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    baseSchemaOptions()
);

withSoftDelete(otpSchema);

// Fast lookup of a user's active OTP for a given purpose.
otpSchema.index({ UId: 1, purpose: 1 });
// TTL cleanup: Mongo removes each document once `expiresAt` has passed.
// Documents with expiresAt = null (legacy) are left untouched.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.models.otps || mongoose.model('otps', otpSchema);

module.exports = { OTP };
