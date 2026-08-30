const mongoose = require('mongoose');
const { baseSchemaOptions, withSoftDelete } = require('./model.utils');

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        }
    },
    baseSchemaOptions()
);

withSoftDelete(blogSchema);

const Blog = mongoose.models.blogs || mongoose.model('blogs', blogSchema);

module.exports = { Blog };
