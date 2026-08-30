const { AppError } = require("./AppError.js")
class DatabaseError extends AppError {
    constructor(message = "Database operation failed") {
        super(message, 500);
    }
}

module.exports = { DatabaseError }