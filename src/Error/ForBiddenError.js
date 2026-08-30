const { AppError } = require("./AppError.js")
class ForbiddenError extends AppError {
    constructor(message = "Access denied") {
        super(message, 403);
    }
}

module.exports = { ForbiddenError }