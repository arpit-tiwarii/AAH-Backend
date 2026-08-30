const mongoose = require('mongoose');
const { Fee } = require('../models/fee.model');

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function buildPopulatedFee(doc) {
    if (!doc) return null;
    const fee = doc.toObject ? doc.toObject() : doc;
    const populatedUser = fee.userId && typeof fee.userId === 'object' ? fee.userId : null;

    return {
        ...fee,
        user: populatedUser,
        userId: populatedUser?.id || (typeof fee.userId === 'string' ? fee.userId : fee.userId?.toString?.() || null),
    };
}

async function findAllWithAthlete() {
    const fees = await Fee.find()
        .populate({
            path: 'userId',
            select: 'name email status sports contact age school afiId role profile',
            options: { lean: true },
        })
        .sort({ createdAt: -1 });

    return fees.map(buildPopulatedFee);
}

async function findByUserId(userId) {
    if (!isValidId(userId)) return [];
    return await Fee.find({ userId }).sort({ createdAt: -1 });
}

async function findOneByUserMonthYear(userId, month, year) {
    if (!isValidId(userId)) return null;
    return await Fee.findOne({ userId, month, year });
}

async function createFee(data, options = {}) {
    const [fee] = await Fee.create([data], options);
    return fee;
}

async function findById(id) {
    if (!isValidId(id)) return null;
    return await Fee.findById(id);
}

async function updateFee(id, updates, options = {}) {
    if (!isValidId(id)) return null;
    return await Fee.findOneAndUpdate(
        { _id: id, deletedAt: null },
        updates,
        {
            new: true,
            runValidators: true,
            ...options,
        }
    );
}

async function findPendingPayments() {
    const fees = await Fee.find({
        status: 'PENDING',
        submittedAt: null,
    }).populate({
        path: 'userId',
        select: 'name email sports',
        options: { lean: true },
    });

    return fees.map(buildPopulatedFee);
}

module.exports = {
    findAllWithAthlete,
    findByUserId,
    findOneByUserMonthYear,
    createFee,
    findById,
    updateFee,
    findPendingPayments
};
