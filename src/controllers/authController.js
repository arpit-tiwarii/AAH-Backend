const { loginUser } = require('../services/login.service')
const { registerUser } = require('../services/register.service')
const { requestPasswordResetService, resetPasswordService } = require('../services/password.service')
const { success } = require('../utils/apiResponse')

const registerController = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    return success(res, result, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const loginController = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    return success(res, result, 'login Successfully', 201);
  } catch (err) {
    next(err);
  }
};

// Always 200 with the same body, registered address or not, so the response
// cannot be used to discover which emails have accounts. No data is echoed
// back — in particular no user id and no OTP.
const forgotPasswordController = async (req, res, next) => {
  try {
    const result = await requestPasswordResetService(req.body);
    return success(res, null, result.message, 200);
  } catch (err) {
    next(err);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const result = await resetPasswordService(req.body);
    return success(res, null, result.message, 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
};
