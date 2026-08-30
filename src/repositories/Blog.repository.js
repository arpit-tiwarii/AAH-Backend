const mongoose = require('mongoose');
const { Blog } = require('../models/blog.model');

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

async function findAllBlogs() {
    return await Blog.find().sort({ createdAt: -1 });
}

async function findById(id) {
    if (!isValidId(id)) return null;
    return await Blog.findById(id);
}

async function createBlog(data, options = {}) {
    const [blog] = await Blog.create([data], options);
    return blog;
}

async function updateBlog(id, updates, options = {}) {
    if (!isValidId(id)) return null;
    return await Blog.findOneAndUpdate(
        { _id: id, deletedAt: null },
        updates,
        {
            new: true,
            runValidators: true,
            ...options,
        }
    );
}

async function deleteBlog(id, options = {}) {
    if (!isValidId(id)) return null;
    const blog = await Blog.findOne({ _id: id, deletedAt: null });
    if (!blog) return null;
    await blog.softDelete(options);
    return true;
}

module.exports = { findAllBlogs, findById, createBlog, updateBlog, deleteBlog };
