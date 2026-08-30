const express = require('express');
const router = express.Router();

const { getBlogs, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const createBlogSchema = require('../schemas/blog.schema');

router.get('/', getBlogs);
router.post('/', protect, restrictTo('admin'), validate(createBlogSchema), createBlog);

router.put('/:id', protect, restrictTo('admin'), updateBlog);
router.delete('/:id', protect, restrictTo('admin'), deleteBlog);

module.exports = router;

