const Ajv = require("ajv");
const addFormats = require("ajv-formats");

// allErrors: report every failing keyword, not just the first, so clients get
// a complete picture. addFormats must be registered before any schema that
// uses "format" (e.g. email) is compiled.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const formatErrors = (errors = []) =>
    errors.map((e) => {
        const field = e.instancePath
            ? e.instancePath.replace(/^\//, "")
            : (e.params && e.params.missingProperty) || "";
        return { field: field || undefined, message: e.message };
    });

const validate = (Schema) => {
    const validator = ajv.compile(Schema);

    return (req, res, next) => {
        const valid = validator(req.body);
        if (!valid) {
            const errors = formatErrors(validator.errors);
            const first = errors[0];
            const message = first
                ? `Validation failed${first.field ? ` for "${first.field}"` : ""}: ${first.message}`
                : "Validation failed";

            return res.status(400).json({
                code: "VALIDATION_ERROR",
                message,
                errors,
            });
        }
        next();
    };
};

module.exports = { validate };
