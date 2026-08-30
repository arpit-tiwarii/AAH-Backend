
const { success } = require('../utils/apiResponse')
const {
  getAllAthletesService,
  getAthleteByIdService,
  updateAthleteService,
  updateAthleteStatusService,
  deleteAthleteService
} = require('../services/athelete.service')


// const { uploadBufferToCloudinary } = require('../services/cloudinaryUpload');

// @desc    Get all athletes
// @route   GET /api/athletes
// @access  Private
const getAllAthletes = async (req, res, next) => {
  try {
    const result = await getAllAthletesService()
    return success(res, result, "Fetched Athletes list successfully", 201)
  } catch (error) {
    next(error)
  }
};

// @desc    Get athlete by ID
// @route   GET /api/athletes/:id
// @access  Public (for viewing own reg)
const getAthleteById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await getAthleteByIdService(id)
    return success(res, result, "Fetched Athlete successfully", 201)
  } catch (error) {
    next(error)
  }
};

// @desc    Update athlete profile
// @route   PUT /api/athletes/:id
// @access  Public (athlete updates their info)
const updateAthlete = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await updateAthleteService(id, req.body)
    return success(res, result, "Athlete updated successfully", 201)
  } catch (error) {
    next(error)
  }
};

// @desc    Delete athlete profile
// @route   DELETE /api/athletes/:id
// @access  Private (Admin only)
const deleteAthlete = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await deleteAthleteService(id)
    return success(res, result, "Athlete deleted successfully", 201)
  } catch (error) {
    next(error)
  }
};

// @desc    Update athlete status (approve/reject)
// @route   PUT /api/athletes/:id/status
// @access  Private (Admin only)
const updateAthleteStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await updateAthleteStatusService(id, req.body)
    return success(res, result, "Athlete status updated successfully", 201)
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getAllAthletes,
  getAthleteById,
  updateAthlete,
  deleteAthlete,
  updateAthleteStatus
};
