const { findAllBlogs, findById, createBlog, updateBlog, deleteBlog } = require('../repositories/Blog.repository');
const { InternalServerError } = require('../Error/InternalServerError');
const { ValidationError } = require('../Error/ValidationError');

const getBlogs = async () => {
    try {
        return await findAllBlogs();
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const create = async ({ title, content, userId }) => {
    if (!title || !content || !userId) throw new ValidationError('title and content and userId are required.');
    try {
        return await createBlog({ title, content, userId });
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const update = async (id, { title, content }) => {
    if (!title || !content) throw new ValidationError('title and content are required.');
    try {
        const updated = await updateBlog(id, { title, content });
        if (!updated) throw new ValidationError('Blog not found.');
        return updated;
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(error.message);
    }
};

const remove = async (id) => {
    try {
        const deleted = await deleteBlog(id);
        if (!deleted) throw new ValidationError('Blog not found.');
        return { message: 'Blog deleted successfully.' };
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(error.message);
    }
};

module.exports = { getBlogs, create, update, remove };
