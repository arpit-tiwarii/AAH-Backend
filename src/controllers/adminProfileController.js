const {
  getAdminProfile: getAdminProfileService,
  updateAdminProfileImage: updateAdminProfileImageService,
  updateStudentProfileImage: updateStudentProfileImageService,
} = require('../services/adminProfile.service');
const { success } = require('../utils/apiResponse');

// @desc  Get admin profile
// @route GET /api/admin/profile
// @access Private (admin)
const getAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const profile = await getAdminProfileService(adminId);
    return success(res, profile, 'Admin profile retrieved', 200);
  } catch (error) {
    next(error);
  }
};

// @desc  Update admin profile image (and optionally name/email)
// @route PUT /api/admin/profile
// @access Private (admin)
const updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const fileBuffer = req.file?.buffer;
    const updates = {
      name: req.body.name,
      email: req.body.email,
    };

    const updated = await updateAdminProfileImageService(adminId, fileBuffer, updates);
    return success(res, updated, 'Admin profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// @desc  Update a student's profile image (admin only)
// @route PUT /api/admin/students/:id/profile-image
// @access Private (admin)
const updateStudentProfileImage = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const fileBuffer = req.file?.buffer;

    const updated = await updateStudentProfileImageService(studentId, fileBuffer);
    return success(res, updated, 'Student profile image updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminProfile, updateAdminProfile, updateStudentProfileImage };

