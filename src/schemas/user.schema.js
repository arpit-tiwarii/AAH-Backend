// Password policy mirrors validatePasswordStrength() in utils/password.util.js:
// at least 8 characters, containing both a letter and a digit.
const passwordRule = {
    type: "string",
    minLength: 8,
    pattern: "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
};

const registerSchema = {
    type: "object",

    required: [
        "name",
        "email",
        "password",
        "age",
        "sports",
        "contact",
        "aadhar"
    ],

    properties: {
        name: {
            type: "string",
            minLength: 2
        },

        email: {
            type: "string",
            format: "email"
        },

        password: passwordRule,

        role: {
            type: "string",
            enum: ["ATHLETE", "ADMIN", "COACH"]
        },

        age: {
            type: "integer",
            minimum: 1
        },

        sports: {
            type: "string"
        },

        contact: {
            type: "string",
            pattern: "^[0-9]{10}$"
        },

        afiId: {
            type: "string"
        },

        aadhar: {
            type: "string"
        },

        school: {
            type: "string"
        },
    },

    additionalProperties: false
};


const loginSchema = {
    type: "object",

    required: ["email", "password"],

    properties: {
        email: {
            type: "string",
            format: "email"
        },

        password: {
            type: "string",
            minLength: 1
        }
    },

    additionalProperties: false
};

// Step 1 of the reset flow. Only an email is accepted — nothing about the
// account is returned, so there is nothing else to supply.
const forgotPasswordSchema = {
    type: "object",

    required: ["email"],

    properties: {
        email: {
            type: "string",
            format: "email"
        }
    },

    additionalProperties: false
};

// Step 2 of the reset flow: the emailed 6-digit code plus the new password.
// Identifying by email (not a user id) keeps the account id out of the client.
const resetPasswordSchema = {
    type: "object",

    required: ["email", "otp", "password"],

    properties: {
        email: {
            type: "string",
            format: "email"
        },

        otp: {
            type: "string",
            pattern: "^[0-9]{6}$"
        },

        password: passwordRule
    },

    additionalProperties: false
};

// Self-service profile update (PUT /athlete/:id). Only the fields the athlete
// service actually persists are accepted; role/email/password/status are
// deliberately excluded so a user can never escalate or hijack their account
// through this endpoint.
const updateSchema = {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
        name: {
            type: "string",
            minLength: 2
        },

        age: {
            type: "integer",
            minimum: 1
        },

        sports: {
            type: "string"
        },

        contact: {
            type: "string",
            pattern: "^[0-9]{10}$"
        },

        afiId: {
            type: "string"
        },

        school: {
            type: "string"
        }
    }
}

module.exports = { loginSchema, registerSchema, updateSchema, forgotPasswordSchema, resetPasswordSchema }
