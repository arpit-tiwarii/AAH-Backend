const { AppError } = require("./AppError.js")
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

module.exports = { UnauthorizedError }