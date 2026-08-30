const { uploadStudentDocuments: uploadStudentDocumentsService } = require('../services/athleteDocument.service');
const { success } = require('../utils/apiResponse');

// @desc   Upload student documents to Cloudinary
// @route  PUT /api/athletes/:id/documents
// @access Private (athlete only - uploads their own docs)
const uploadStudentDocumentsController = async (req, res, next) => {
  try {
    const athleteId = req.params.id;
    const userId = req.user.id;
    const files = req.files || {};
    const afiId = req.body?.afiId;

    const updated = await uploadStudentDocumentsService(athleteId, userId, files, afiId);
    return success(res, updated, 'Documents uploaded successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadStudentDocumentsController };

