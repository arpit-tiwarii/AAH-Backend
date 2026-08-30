const { findAllWithAthlete, findByUserId, findOneByUserMonthYear, createFee, findById, updateFee } = require('../repositories/Fee.repository');
const { findApprovedAthletes } = require('../repositories/User.repository');
const { uploadBufferToCloudinary } = require('./cloudinaryUpload');
const { CLOUDINARY_FOLDERS } = require('../utils/constants');
const { DatabaseError } = require('../Error/DataBaseError');
const { InternalServerError } = require('../Error/InternalServerError');
const { ValidationError } = require('../Error/ValidationError');

const getAllFees = async () => {
    try {

        return await findAllWithAthlete();
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const getMyFees = async (userId) => {
    try {
        return await findByUserId(userId);
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const generateMonthlyFees = async ({ month, year, amount }) => {
    if (!month || !year || !amount) throw new ValidationError('Month, year, and amount are required');

    try {
        const athletes = await findApprovedAthletes();
        let createdCount = 0;
        for (const athlete of athletes) {
            const exists = await findOneByUserMonthYear(athlete.id, month, year);
            if (!exists) {
                await createFee({ userId: athlete.id, month, year, amount });
                createdCount++;
            }
        }
        return { message: `Successfully generated ${createdCount} Fee records for ${month} ${year}` };
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const uploadFeeProof = async (feeId, userId, file, transactionId) => {
    try {
        if (!file || !file.buffer) throw new ValidationError('Payment screenshot is required.');

        const fee = await findById(feeId);
        if (!fee) throw new ValidationError('Fee record not found');
        if (fee.userId?.toString() !== userId?.toString()) throw new ValidationError('Not authorized to update this record');
        // Proof can be re-submitted as often as needed while the payment is
        // awaiting review or was rejected — but an approved payment is final.
        if (fee.status === 'APPROVED') {
            throw new ValidationError('This payment is already approved. No further proof can be submitted.');
        }

        const folder = CLOUDINARY_FOLDERS.FEES(fee.id.toString());
        const result = await uploadBufferToCloudinary(file.buffer, { folder, publicId: 'screenshot' });

        const updates = {
            screenshot: result.secure_url,
            status: 'PENDING',
            submittedAt: new Date(),
            // A fresh proof needs a fresh review: drop the previous verdict so a
            // re-submission after a rejection re-enters the admin's queue clean.
            verifiedAt: null,
        };

        const trimmedTxn = transactionId ? String(transactionId).trim() : '';
        if (trimmedTxn) updates.transactionId = trimmedTxn;

        const updated = await updateFee(feeId, updates);
        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(error.message);
    }
};

const verifyFee = async (feeId, status) => {
    try {
        const valid = ['PENDING', 'APPROVED', 'REJECT', 'REJECTED'];
        const upper = String(status).toUpperCase();
        if (!valid.includes(upper)) throw new ValidationError('Invalid status');
        const fee = await findById(feeId);
        if (!fee) throw new ValidationError('Fee record not found');
        const updated = await updateFee(feeId, { status: upper, verifiedAt: new Date() });
        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(error.message);
    }
};

module.exports = { getAllFees, getMyFees, generateMonthlyFees, uploadFeeProof, verifyFee };
