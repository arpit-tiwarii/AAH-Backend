const { updateAthleteProfileImage } = require('../services/athleteProfile.service');
const { success } = require('../utils/apiResponse');

// @desc  Athlete updates their own profile image
// @route PUT /api/athletes/:id/profile-image
// @access Private (athlete)
const updateAthleteProfileImageController = async (req, res, next) => {
  try {
    const athleteId = req.params.id;
    const userId = req.user.id;
    const fileBuffer = req.file?.buffer;

    const updated = await updateAthleteProfileImage(athleteId, userId, fileBuffer);

    return success(res, updated, 'Profile image updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = { updateAthleteProfileImageController };

