const createBlogSchema = {
    type: "object",
    required: ["title", "content"],
    additionalProperties: false,

    properties: {
        title: {
            type: "string",
            minLength: 1,
            maxLength: 255
        },

        content: {
            type: "string",
            minLength: 1
        }
    }
};

module.exports = createBlogSchema;
