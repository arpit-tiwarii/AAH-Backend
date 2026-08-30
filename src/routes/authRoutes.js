const express = require('express');
const router = express.Router();
const {
    loginController,
    registerController,
    forgotPasswordController,
    resetPasswordController,
} = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const {
    authLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
} = require('../utils/rateLimit');
const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require('../schemas/user.schema');

// Public route for unified login
router.post('/login', authLimiter, validate(loginSchema), loginController);
router.post('/register', authLimiter, validate(registerSchema), registerController);

// Password reset by emailed OTP. Both steps are public by necessity — the user
// cannot authenticate — so both are rate limited per route.
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPasswordController);

module.exports = router;
