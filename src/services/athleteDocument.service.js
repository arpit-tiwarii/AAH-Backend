/**
 * Athlete Document Service
 * Handles student document uploads (Aadhar, Birth Certificate)
 */

const { uploadBufferToCloudinary } = require('./cloudinaryUpload');
const { findUserById, updateUserById } = require('../repositories/User.repository');
const { ValidationError } = require('../Error/ValidationError');
const { InternalServerError } = require('../Error/InternalServerError');
const { CLOUDINARY_FOLDERS } = require('../utils/constants');

/**
 * Upload student documents to Cloudinary
 * @param {number} athleteId - ID of the athlete
 * @param {number} userId - ID of the authenticated user (must match athleteId)
 * @param {Object} files - Files object from multer
 * @param {string} afiId - AFI ID for the athlete
 * @returns {Promise<Object>} Updated athlete profile
 * @throws {ValidationError} If validation fails or not authorized
 * @throws {InternalServerError} If upload or update fails
 */
async function uploadStudentDocuments(athleteId, userId, files, afiId) {
    try {
        // Authorization check - athlete can only upload their own documents
        if (userId.toString() !== athleteId.toString()) {
            throw new ValidationError('Not authorized to upload documents for this athlete.');
        }

        // Validate AFI ID
        if (!afiId) {
            throw new ValidationError('AFI ID is required.');
        }

        const normalizedAfiId = String(afiId).trim();
        if (!normalizedAfiId) {
            throw new ValidationError('AFI ID is required.');
        }

        // Validate files exist
        if (!files || !files.aadharCard || !files.birthCertificate) {
            throw new ValidationError('Both Aadhar Card and Birth Certificate files are required.');
        }

        const aadharCardFile = files.aadharCard[0];
        const birthCertificateFile = files.birthCertificate[0];

        if (!aadharCardFile) {
            throw new ValidationError('Aadhar Card file is required.');
        }

        if (!birthCertificateFile) {
            throw new ValidationError('Birth Certificate file is required.');
        }

        // Fetch athlete
        const athlete = await findUserById(athleteId);
        const role = String(athlete?.role || '').toUpperCase();
        if (!athlete || role !== 'ATHLETE') {
            throw new ValidationError('Athlete not found.');
        }

        // Upload documents to Cloudinary
        const folder = CLOUDINARY_FOLDERS.STUDENT_DOCS(athleteId.toString());

        const birthResult = await uploadBufferToCloudinary(birthCertificateFile.buffer, {
            folder,
            publicId: 'birthCertificate',
        });

        const aadharResult = await uploadBufferToCloudinary(aadharCardFile.buffer, {
            folder,
            publicId: 'aadharCard',
        });

        // Update athlete in database via repository
        const updateData = {
            birthCertificate: birthResult.secure_url,
            aadharCard: aadharResult.secure_url,
            afiId: normalizedAfiId,
        };

        const updated = await updateUserById(athleteId, updateData);

        if (!updated) {
            throw new InternalServerError('Failed to update athlete documents');
        }

        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(`Server error: ${error.message}`);
    }
}

module.exports = {
    uploadStudentDocuments,
};
