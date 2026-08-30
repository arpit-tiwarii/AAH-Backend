const blogService = require('../services/blog.service');
const { success } = require('../utils/apiResponse');

// @desc   Get all blogs
// @route  GET /api/blogs
// @access Public
const getBlogs = async (req, res, next) => {
  try {
    const blogs = await blogService.getBlogs();
    return success(res, blogs, 'Fetched blogs', 200);
  } catch (error) {
    next(error);
  }
};

// @desc   Create a blog post (admin only)
// @route  POST /api/blogs
// @access Private (admin)
const createBlog = async (req, res, next) => {
  try {
    // Author is taken from the authenticated session, never from the request
    // body, so a client cannot attribute a post to another user.
    const created = await blogService.create({
      title: req.body.title,
      content: req.body.content,
      userId: req.user.id,
    });
    return success(res, created, 'Blog created', 201);
  } catch (error) {
    next(error);
  }
};

// @desc   Update a blog post (admin only)
// @route  PUT /api/blogs/:id
// @access Private (admin)
const updateBlog = async (req, res, next) => {
  try {
    const updated = await blogService.update(req.params.id, req.body);
    return success(res, updated, 'Blog updated', 200);
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a blog post (admin only)
// @route  DELETE /api/blogs/:id
// @access Private (admin)
const deleteBlog = async (req, res, next) => {
  try {
    const result = await blogService.remove(req.params.id);
    return success(res, result, 'Blog deleted', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = { getBlogs, createBlog, updateBlog, deleteBlog };

