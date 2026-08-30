const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isAllowedMime = ALLOWED_MIME_TYPES.has(file.mimetype);
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);

  if (!isAllowedMime || !isAllowedExt) {
    return cb(new Error('Invalid file type. Only JPG/PNG images are allowed.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1,
  },
  fileFilter,
});

module.exports = { upload };

