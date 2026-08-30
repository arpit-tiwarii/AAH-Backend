const express = require('express');
const router = express.Router();
const { createOtpController, verifyOtpController } = require('../controllers/otp.controller.js');
const { validate } = require('../middleware/validate');
const { otpLimiter } = require('../utils/rateLimit');
const { sendOtpSchema, verifyOtpSchema } = require('../schemas/otp.schema');

router.post('/send', otpLimiter, validate(sendOtpSchema), createOtpController);
router.post('/verify', otpLimiter, validate(verifyOtpSchema), verifyOtpController);

module.exports = router;
