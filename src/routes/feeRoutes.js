const express = require('express');
const router = express.Router();
const createFeeSchema = require('../schemas/fees.schema')
const { validate } = require('../middleware/validate')
const multer = require('multer');
const {
  getAllFees,
  getMyFees,
  generateMonthlyFees,
  uploadFeeProof,
  verifyFee
} = require('../controllers/feeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Multer Storage Configuration (memory -> upload to Cloudinary)
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const isAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
    if (!isAllowed) return cb(new Error('Invalid file type. Only JPG/PNG are allowed.'));
    cb(null, true);
  },
});

// Routes for Athlete
router.get('/my-fees', protect, getMyFees);
router.put('/:id/upload', protect, restrictTo('athlete'), upload.single('screenshot'), uploadFeeProof);

// Routes for Admin
router.get('/', protect, restrictTo('admin'), getAllFees);
router.post('/generate', protect, restrictTo('admin'), validate(createFeeSchema), generateMonthlyFees);
router.put('/:id/verify', protect, restrictTo('admin'), verifyFee);

module.exports = router;
