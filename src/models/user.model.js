const mongoose = require('mongoose');
const { baseSchemaOptions, withSoftDelete, normalizeRole, normalizeStatus } = require('./model.utils');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['ATHLETE', 'ADMIN', 'COACH'],
            default: 'ATHLETE',
            set: normalizeRole,
        },
        age: {
            type: Number,
            required: true,
            min: 1,
        },
        sports: {
            type: String,
            required: true,
            trim: true,
        },
        contact: {
            type: String,
            required: true,
            trim: true,
        },
        afiId: {
            type: String,
            trim: true,
            default: null,
        },
        aadhar: {
            type: String,
            trim: true,
            default: null,
        },
        school: {
            type: String,
            trim: true,
            default: null,
        },
        profile: {
            type: String,
            default: null,
        },
        aadharCard: {
            type: String,
            default: null,
        },
        birthCertificate: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
            set: normalizeStatus,
        },
        verify: {
            type: Boolean,
            default: false,
        },
        // Set whenever the password changes. `protect` rejects any JWT issued
        // before this instant, so a password reset logs out existing sessions.
        // null (legacy accounts) means "no reset yet" and skips the check.
        passwordChangedAt: {
            type: Date,
            default: null,
        }
    },
    baseSchemaOptions()
);

withSoftDelete(userSchema);

userSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: { deletedAt: null },
    }
);

userSchema.index(
    { contact: 1 },
    {
        unique: true,
        partialFilterExpression: { deletedAt: null },
    }
);

const User = mongoose.models.users || mongoose.model('users', userSchema);

module.exports = { User };
