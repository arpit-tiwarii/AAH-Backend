const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/profileImageUpload');
const {
  getAdminProfile,
  updateAdminProfile,
  updateStudentProfileImage,
} = require('../controllers/adminProfileController');

// Admin profile
router.get('/profile', protect, restrictTo('ADMIN'), getAdminProfile);
router.put('/profile', protect, restrictTo('ADMIN'), upload.single('profileImage'), updateAdminProfile);

// Admin updates a student's profile image
router.put(
  '/students/:id/profile-image',
  protect,
  restrictTo('ADMIN'),
  upload.single('profileImage'),
  updateStudentProfileImage
);

module.exports = router;

