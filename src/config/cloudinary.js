const cloudinary = require('cloudinary').v2;
const { config } = require('../env');

cloudinary.config({
  cloud_name: config.storage.cloudinary.cloudName,
  api_key: config.storage.cloudinary.apiKey,
  api_secret: config.storage.cloudinary.apiSecret,
});

const verifyCloudinaryConnection = async () => {
  if (!config.storage.cloudinary.cloudName || !config.storage.cloudinary.apiKey || !config.storage.cloudinary.apiSecret) {
    throw new Error('Cloudinary configuration is incomplete. Check CLOUDINARY_* values.');
  }

  await cloudinary.api.ping();
  return true;
};

module.exports = { cloudinary, verifyCloudinaryConnection };

