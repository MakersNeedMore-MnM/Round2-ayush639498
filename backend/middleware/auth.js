const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { dbIsConnected } = require('../config/db');
const { DEMO_USERS } = require('../utils/demoAuth');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'development-only-rashak-secret';
// The role a request is treated as is decided only by what the server itself
// issued: a verified JWT bearer token for the registered account or role selection
// flow. A client cannot assert its own role by sending a body field or role header.
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.slice(7), EFFECTIVE_JWT_SECRET);
      let user = null;
      if (decoded.user?.role) {
        user = decoded.user;
      } else if (dbIsConnected() && decoded.id) {
        user = await User.findById(decoded.id).select('-password');
      }
      if (!user && decoded.id) user = DEMO_USERS.find(x => x.id === decoded.id || x._id === decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = user;
      return next();
    }
    if (process.env.DEMO_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
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

module.exports = { protect, permit, JWT_SECRET: EFFECTIVE_JWT_SECRET };
