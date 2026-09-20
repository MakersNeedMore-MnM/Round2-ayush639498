const express = require('express');
const rateLimit = require('express-rate-limit');
const r = express.Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Tighter limiter for auth/session endpoints — these are the most attractive
// Credential based login remains rate limited for future authenticated deployments.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts, please try again later' } });

r.post('/login', authLimiter, c.login);
r.post('/register', authLimiter, c.register);
r.post('/role', authLimiter, c.selectRole);
r.post('/logout', c.logout);
r.get('/csrf', c.csrf);
r.get('/me', protect, c.me);

module.exports = r;
