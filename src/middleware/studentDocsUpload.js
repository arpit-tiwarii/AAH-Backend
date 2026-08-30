const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isAllowedByExt = ALLOWED_EXTENSIONS.has(ext);

  if (!isAllowed || !isAllowedByExt) {
    return cb(new Error('Invalid file type. Only PDF/JPG/PNG are allowed.'));
  }
  cb(null, true);
};

// Cloudinary accepts files up to a practical size; we also limit here.
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 2,
  },
  fileFilter,
});

module.exports = { upload };

