const mongoose = require('mongoose');
const { config } = require('../env');
const { logger } = require('../utils/logger');
const { DatabaseError } = require('../Error/DataBaseError.js');

mongoose.connection.on('error', (err) => {
  logger.error({ err: err?.message }, 'MongoDB connection error');
});
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

async function connectDB() {
  try {
    if (!config.database.mongoUri) {
      throw new Error('MONGODB_URI is not configured');
    }

    await mongoose.connect(config.database.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info({ db: mongoose.connection.name }, 'Database connected');
  } catch (err) {
    throw new DatabaseError(err?.message || 'MongoDB connection failed');
  }
}

module.exports = { mongoose, connectDB };
