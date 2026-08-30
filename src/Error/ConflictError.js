const { AppError } = require("./AppError.js")
class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409);
    }
}


module.exports = { ConflictError }