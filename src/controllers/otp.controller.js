const { resendOtpService, verifyOtpService } = require('../services/otp.service.js');
const { success } = require('../utils/apiResponse.js');

const createOtpController = async (req, res, next) => {
    try {
        const result = await resendOtpService(req.body);
        return success(res, result, 'OTP sent', 201);
    } catch (err) {
        next(err);
    }
};

const verifyOtpController = async (req, res, next) => {
    try {
        const result = await verifyOtpService(req.body);
        return success(res, result, 'OTP verified', 200);
    } catch (err) {
        next(err);
    }
};

module.exports = { createOtpController, verifyOtpController };