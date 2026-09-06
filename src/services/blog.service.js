const { findAllBlogs, findById, createBlog, updateBlog, deleteBlog } = require('../repositories/Blog.repository');
const { InternalServerError } = require('../Error/InternalServerError');
const { ValidationError } = require('../Error/ValidationError');
const { getCache, setCache, deleteCache } = require('../utils/cache');

const BLOGS_CACHE_KEY = 'blogs:all';
const BLOGS_CACHE_TTL_SECONDS = 60;

const getBlogs = async () => {
    try {
        const cachedBlogs = await getCache(BLOGS_CACHE_KEY);
        if (cachedBlogs !== null) {
            return cachedBlogs;
        }

        const blogs = await findAllBlogs();
        await setCache(BLOGS_CACHE_KEY, blogs, BLOGS_CACHE_TTL_SECONDS);
        return blogs;
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const create = async ({ title, content, userId }) => {
    if (!title || !content || !userId) throw new ValidationError('title and content and userId are required.');
    try {
        const blog = await createBlog({ title, content, userId });
        await deleteCache(BLOGS_CACHE_KEY);
        return blog;
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const update = async (id, { title, content }) => {
    if (!title || !content) throw new ValidationError('title and content are required.');
    try {
        const updated = await updateBlog(id, { title, content });
        if (!updated) throw new ValidationError('Blog not found.');
        await deleteCache(BLOGS_CACHE_KEY);
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
        await deleteCache(BLOGS_CACHE_KEY);
        return { message: 'Blog deleted successfully.' };
    } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new InternalServerError(error.message);
    }
};

module.exports = { getBlogs, create, update, remove };
