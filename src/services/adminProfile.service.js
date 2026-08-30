/**
 * Admin Profile Service
 * Handles admin profile operations and student profile management
 */

const { uploadBufferToCloudinary } = require('./cloudinaryUpload');
const { findUserById, updateUserById } = require('../repositories/User.repository');
const { ValidationError } = require('../Error/ValidationError');
const { InternalServerError } = require('../Error/InternalServerError');
const { CLOUDINARY_FOLDERS } = require('../utils/constants');

/**
 * Get admin profile
 * @param {number} adminId - ID of the admin
 * @returns {Promise<Object>} Admin profile details
 * @throws {ValidationError} If admin not found
 */
async function getAdminProfile(adminId) {
    try {
        const admin = await findUserById(adminId);
        const role = String(admin?.role || '').toUpperCase();

        if (!admin || role !== 'ADMIN') {
            throw new ValidationError('Admin not found');
        }

        return admin;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error: ${error.message}`);
    }
}

/**
 * Update admin profile image
 * @param {number} adminId - ID of the admin
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {Object} updates - Additional updates (name, email)
 * @returns {Promise<Object>} Updated admin profile
 * @throws {ValidationError} If admin not found or file missing
 */
async function updateAdminProfileImage(adminId, fileBuffer, updates = {}) {
    try {
        if (!fileBuffer) {
            throw new ValidationError('Profile image file is required.');
        }

        // Fetch admin
        const admin = await findUserById(adminId);
        const role = String(admin?.role || '').toUpperCase();
        if (!admin || role !== 'ADMIN') {
            throw new ValidationError('Admin not found.');
        }

        // Upload to Cloudinary
        const folder = CLOUDINARY_FOLDERS.ADMIN_PROFILES(adminId.toString());
        const result = await uploadBufferToCloudinary(fileBuffer, {
            folder,
            publicId: 'profileImage',
        });

        // Prepare updates
        const updateData = {
            profile: result.secure_url,
            ...(updates.name && { name: updates.name }),
            ...(updates.email && { email: updates.email }),
        };

        // Update admin in database via repository
        const updated = await updateUserById(adminId, updateData);

        if (!updated) {
            throw new InternalServerError('Failed to update admin profile');
        }

        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error: ${error.message}`);
    }
}

/**
 * Update student profile image (admin only)
 * @param {number} studentId - ID of the student
 * @param {Buffer} fileBuffer - Image file buffer
 * @returns {Promise<Object>} Updated student profile
 * @throws {ValidationError} If student not found or file missing
 */
async function updateStudentProfileImage(studentId, fileBuffer) {
    try {
        if (!fileBuffer) {
            throw new ValidationError('Profile image file is required.');
        }

        // Fetch student
        const student = await findUserById(studentId);
        const role = String(student?.role || '').toUpperCase();
        if (!student || role !== 'ATHLETE') {
            throw new ValidationError('Student not found.');
        }

        // Upload to Cloudinary
        const folder = CLOUDINARY_FOLDERS.STUDENT_PROFILES(studentId.toString());
        const result = await uploadBufferToCloudinary(fileBuffer, {
            folder,
            publicId: 'profileImage',
        });

        // Update student in database via repository
        const updated = await updateUserById(studentId, { profile: result.secure_url });

        if (!updated) {
            throw new InternalServerError('Failed to update student profile');
        }

        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error: ${error.message}`);
    }
}

module.exports = {
    getAdminProfile,
    updateAdminProfileImage,
    updateStudentProfileImage,
};
