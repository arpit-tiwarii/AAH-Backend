const mongoose = require('mongoose');
const { User } = require('../models/user.model');

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function withPassword(query, options = {}) {
    if (options.includePassword) {
        return query.select('+password');
    }
    return query;
}

async function findUserByEmail(email) {
    return await User.findOne({ email: String(email).toLowerCase() }).select('+password');
}

async function findAllAthletes() {
    return await User.find({ role: 'ATHLETE' }).sort({ createdAt: -1 });
}

async function createUser(data, options = {}) {
    const [user] = await User.create([data], options);
    return user;
}

async function findUserById(id, options = {}) {
    if (!isValidId(id)) return null;
    let query = User.findById(id);
    query = withPassword(query, options);
    return await query;
}

async function updateUserById(id, updates, options = {}) {
    if (!isValidId(id)) return null;

    let query = User.findOneAndUpdate(
        { _id: id, deletedAt: null },
        updates,
        {
            new: true,
            runValidators: true,
            ...options,
        }
    );

    query = withPassword(query, options);
    return await query;
}

async function deleteUserById(id, options = {}) {
    if (!isValidId(id)) return null;
    const user = await User.findOne({ _id: id, deletedAt: null });
    if (!user) return null;
    await user.softDelete(options);
    return true;
}

async function countAdminUsers() {
    return await User.countDocuments({ role: 'ADMIN' });
}

async function findApprovedAthletes() {
    return await User.find({
        role: 'ATHLETE',
        status: 'APPROVED',
    });
}

module.exports = {
    findUserByEmail,
    findAllAthletes,
    createUser,
    findUserById,
    updateUserById,
    deleteUserById,
    countAdminUsers,
    findApprovedAthletes,
};
