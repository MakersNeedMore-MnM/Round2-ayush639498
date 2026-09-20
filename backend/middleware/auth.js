const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { dbIsConnected } = require('../config/db');
const { DEMO_USERS } = require('../utils/demoAuth');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'development-only-rashak-secret';
const SESSION_COOKIE = 'rashak_session';

// The role a request is treated as is decided ONLY by what the server itself
// issued: either a signed httpOnly session cookie (set after the resident/admin
// role selection flow, see authController.selectRole) or a verified JWT bearer
// token for a registered account. A client can never assert its own role by
// sending a header or a body field — those are ignored for authorization.
async function protect(req, res, next) {
  try {
    // 1) Registered account via Bearer token (email/password flow, still supported)
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], EFFECTIVE_JWT_SECRET);
      let user = null;
      if (dbIsConnected()) user = await User.findById(decoded.id).select('-password');
      if (!user) user = DEMO_USERS.find(u => u.id === decoded.id || u._id === decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = user;
      return next();
    }
    // 2) Server-issued role session cookie (resident / admin quick entry, no password)
    const cookieToken = req.cookies?.[SESSION_COOKIE];
    if (cookieToken) {
      const decoded = jwt.verify(cookieToken, EFFECTIVE_JWT_SECRET);
      req.user = decoded.user;
      return next();
    }
    if (process.env.DEMO_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      // Local development convenience only — never active in production, and
      // never selectable by a deployed client since NODE_ENV gates it too.
      const demo = DEMO_USERS.find(u => u.role === 'DISTRICT_OFFICER') || DEMO_USERS[1];
      req.user = { ...demo };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Authentication required' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

const permit = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ success: false, message: 'Insufficient permissions' });

module.exports = { protect, permit, JWT_SECRET: EFFECTIVE_JWT_SECRET, SESSION_COOKIE };
