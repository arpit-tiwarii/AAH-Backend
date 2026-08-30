const bcrypt = require('bcryptjs');
const { config } = require('../env');

// Single source of truth for the password policy: at least 8 characters,
// containing both a letter and a digit. `passwordRule` in
// schemas/user.schema.js mirrors this so weak passwords are also rejected at
// the edge by AJV — keep the two in step.
const PASSWORD_POLICY_MESSAGE =
    'Password must be at least 8 characters and include letters and numbers.';

const validatePasswordStrength = (password) => {
    if (!password || password.length < 8) {
        return false;
    }

    return /[A-Za-z]/.test(password) && /\d/.test(password);
};

const hashPassword = async (password) =>
    await bcrypt.hash(password, config.auth.passwordSaltRounds);

module.exports = { validatePasswordStrength, hashPassword, PASSWORD_POLICY_MESSAGE };
