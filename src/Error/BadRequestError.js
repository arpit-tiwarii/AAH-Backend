const { AppError } = require("./AppError.js")
class BadRequestError extends AppError {
    constructor(message = "Bad request") {
        super(message, 400);
    }
}
module.exports = { BadRequestError }