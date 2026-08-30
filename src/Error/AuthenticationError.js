const { AppError } = require("./AppError.js")
class Authentication extends AppError {
    constructor(message = "Authentication failed") {
        super(message, 401);
    }
}

module.exports = { Authentication }