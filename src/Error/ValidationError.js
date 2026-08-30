const { AppError } = require("./AppError.js")
class ValidationError extends AppError {
    constructor(message = "Validation failed") {
        super(message, 400);
    }
}

module.exports = { ValidationError }