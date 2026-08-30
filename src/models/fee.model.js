const mongoose = require('mongoose');
const { baseSchemaOptions, withSoftDelete, normalizeStatus } = require('./model.utils');

const feeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            default: null,
        },
        amount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        month: {
            type: String,
            trim: true,
            default: null,
        },
        year: {
            type: Number,
            default: null,
        },
        screenshot: {
            type: String,
            default: null,
        },
        transactionId: {
            type: String,
            trim: true,
            default: null,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
            set: normalizeStatus,
        },
        submittedAt: {
            type: Date,
            default: null,
        },
        verifiedAt: {
            type: Date,
            default: null,
        }
    },
    baseSchemaOptions()
);

withSoftDelete(feeSchema);

feeSchema.index(
    { userId: 1, month: 1, year: 1 },
    {
        unique: true,
        partialFilterExpression: {
            userId: { $type: 'objectId' },
            deletedAt: null,
        },
    }
);

const Fee = mongoose.models.fees || mongoose.model('fees', feeSchema);

module.exports = { Fee };
