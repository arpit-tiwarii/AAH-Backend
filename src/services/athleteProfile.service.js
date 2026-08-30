/**
 * Athlete Profile Service
 * Handles athlete profile updates including profile image uploads
 */

const { uploadBufferToCloudinary } = require('./cloudinaryUpload');
const { findUserById, updateUserById } = require('../repositories/User.repository');
const { ValidationError } = require('../Error/ValidationError');
const { InternalServerError } = require('../Error/InternalServerError');
const { CLOUDINARY_FOLDERS } = require('../utils/constants');

/**
 * Update athlete profile image
 * @param {number} athleteId - ID of the athlete
 * @param {number} userId - ID of the authenticated user (must match athleteId)
 * @param {Buffer} fileBuffer - Image file buffer
 * @returns {Promise<Object>} Updated athlete profile
 * @throws {ValidationError} If athlete not found or not authorized
 * @throws {InternalServerError} If update fails
 */
async function updateAthleteProfileImage(athleteId, userId, fileBuffer) {
    try {
        // Authorization check - athlete can only update their own profile
        if (userId.toString() !== athleteId.toString()) {
            throw new ValidationError('Not authorized to update this profile image.');
        }

        // Fetch athlete
        const athlete = await findUserById(athleteId);
        const role = String(athlete?.role || '').toUpperCase();
        if (!athlete || role !== 'ATHLETE') {
            throw new ValidationError('Athlete not found.');
        }

        if (!fileBuffer) {
            throw new ValidationError('Profile image file is required.');
        }

        // Upload to Cloudinary
        const folder = CLOUDINARY_FOLDERS.STUDENT_PROFILES(athleteId.toString());
        const result = await uploadBufferToCloudinary(fileBuffer, {
            folder,
            publicId: 'profileImage',
        });

        // Update athlete in database via repository
        const updated = await updateUserById(athleteId, { profile: result.secure_url });

        if (!updated) {
            throw new InternalServerError('Failed to update athlete profile');
        }

        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error: ${error.message}`);
    }
}

module.exports = {
    updateAthleteProfileImage,
};
