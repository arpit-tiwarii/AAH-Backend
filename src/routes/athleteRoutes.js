const express = require('express');
const router = express.Router();
const {
  getAllAthletes,
  getAthleteById,
  updateAthlete,
  deleteAthlete,
  updateAthleteStatus
} = require('../controllers/athleteController');
const { protect, restrictTo, requireOwnershipOrAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/studentDocsUpload');
const { uploadStudentDocumentsController } = require('../controllers/studentDocumentController');
const { upload: profileImageUpload } = require('../middleware/profileImageUpload');
const { updateAthleteProfileImageController } = require('../controllers/athleteProfileController');
const { updateSchema } = require("../schemas/user.schema")
const { validate } = require('../middleware/validate')

// Protected routes for Athlete & Admin to view/update profile
router.get('/:id', protect, requireOwnershipOrAdmin('id'), getAthleteById);
router.put('/:id', protect, requireOwnershipOrAdmin('id'), validate(updateSchema), updateAthlete);

// Athlete self profile image
router.put(
  '/:id/profile-image',
  protect,
  restrictTo('ATHLETE'),
  requireOwnershipOrAdmin('id'),
  profileImageUpload.single('profileImage'),
  updateAthleteProfileImageController
);

// Upload athlete documents (Cloudinary-backed)
router.put(
  '/:id/documents',
  protect,
  restrictTo('ATHLETE'),
  requireOwnershipOrAdmin('id'),
  upload.fields([
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
  ]),
  uploadStudentDocumentsController
);

// Protected routes for Admin only
router.get('/', protect, restrictTo('ADMIN'), getAllAthletes);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteAthlete);
router.put('/:id/status', protect, restrictTo('ADMIN'), updateAthleteStatus);
module.exports = router;
