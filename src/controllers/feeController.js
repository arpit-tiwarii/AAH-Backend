const feeService = require('../services/fee.service');
const { success } = require('../utils/apiResponse');

// @desc    Get all fees (Admin)
// @route   GET /api/fees
// @access  Private (Admin)
const getAllFees = async (req, res, next) => {
  try {
    const fees = await feeService.getAllFees();
    // console.log(fees)
    return success(res, fees, 'Fetched fees successfully', 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Get athlete's own fees
// @route   GET /api/fees/my-fees
// @access  Private (Athlete)
const getMyFees = async (req, res, next) => {
  try {
    const fees = await feeService.getMyFees(req.user.id);
    return success(res, fees, 'Fetched user fees successfully', 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate monthly fees for all approved athletes (Admin)
// @route   POST /api/fees/generate
// @access  Private (Admin)
const generateMonthlyFees = async (req, res, next) => {
  try {
    const result = await feeService.generateMonthlyFees(req.body);
    return success(res, result, 'Generate fees completed', 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload Fee proof
// @route   PUT /api/payments/:id/upload
// @access  Private (Athlete)
const uploadFeeProof = async (req, res, next) => {
  try {
    const updated = await feeService.uploadFeeProof(
      req.params.id,
      req.user.id,
      req.file,
      req.body.transactionId
    );
    return success(res, updated, 'Fee proof uploaded', 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Fee (Approve/Reject)
// @route   PUT /api/fees/:id/verify
// @access  Private (Admin)
const verifyFee = async (req, res, next) => {
  try {
    const updated = await feeService.verifyFee(req.params.id, req.body.status);
    return success(res, updated, 'Fee verified', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFees,
  getMyFees,
  generateMonthlyFees,
  uploadFeeProof,
  verifyFee
};
