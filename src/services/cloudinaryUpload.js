const { PassThrough } = require('stream');
const { cloudinary } = require('../config/cloudinary');

// Upload an in-memory buffer to Cloudinary and return the result.
const uploadBufferToCloudinary = (buffer, { folder, publicId }) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });

module.exports = { uploadBufferToCloudinary };

