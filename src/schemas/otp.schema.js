const objectId = { type: "string", pattern: "^[a-fA-F0-9]{24}$" };

const sendOtpSchema = {
    type: "object",
    required: ["uid"],
    additionalProperties: false,
    properties: {
        uid: objectId,
    },
};

const verifyOtpSchema = {
    type: "object",
    required: ["uid", "otp"],
    additionalProperties: false,
    properties: {
        uid: objectId,
        otp: {
            type: "string",
            pattern: "^[0-9]{6}$",
        },
    },
};

module.exports = { sendOtpSchema, verifyOtpSchema };
