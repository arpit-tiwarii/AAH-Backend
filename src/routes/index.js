const { Router } = require('express')
const athleteRoutes = require('./athleteRoutes');
const authRoutes = require('./authRoutes');
const feeRoutes = require('./feeRoutes');
const adminRoutes = require('./adminRoutes');
const blogRoutes = require('./blogRoutes');
const otpRoutes = require('./otpRoutes')
const routes = Router();

// Routes
routes.use('/athlete', athleteRoutes);
routes.use('/admin', adminRoutes);
routes.use('/auth', authRoutes);
routes.use('/payments', feeRoutes);
routes.use('/blogs', blogRoutes);
routes.use('/otps', otpRoutes);

module.exports = { routes }