const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { dbIsConnected } = require('../config/db');
const { DEMO_USERS } = require('../utils/demoAuth');
const { JWT_SECRET, SESSION_COOKIE } = require('../middleware/auth');
const { issueCsrfToken } = require('../middleware/security');

const sign = id => jwt.sign({ id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const clean = u => { const x = u.toObject ? u.toObject() : { ...u }; delete x.password; return x; };
const cookieOpts = () => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 12 * 60 * 60 * 1000, // 12h — a disaster-response shift window, re-select after that
  path: '/'
});

async function login(req, res) {
  const email = (req.body.email || '').toLowerCase();
  const pass = req.body.password || '';
  let u = dbIsConnected() ? await User.findOne({ email }) : null;
  u ||= DEMO_USERS.find(x => x.email === email);
  if (!u || !(await bcrypt.compare(pass, u.password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, token: sign(u._id?.toString() || u.id), user: clean(u) });
}

async function register(req, res) {
  if (!dbIsConnected()) return res.status(503).json({ success: false, message: 'MongoDB required for registration' });
  const { name, email, password, phone, district, state } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Required fields missing' });
  if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  const u = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), phone, district, state, role: 'CITIZEN' });
  res.status(201).json({ success: true, token: sign(u.id), user: clean(u) });
}

// Prototype resident / admin quick entry. The selected role is signed by the server
// into an httpOnly session cookie and is never trusted from the client afterward.
const ROLE_MAP = { RESIDENT: 'CITIZEN', ADMIN: 'ADMIN' };
async function selectRole(req, res) {
  const requested = String(req.body.role || '').toUpperCase();
  const role = ROLE_MAP[requested];
  if (!role) return res.status(400).json({ success: false, message: 'role must be RESIDENT or ADMIN' });
  const template = role === 'ADMIN' ? DEMO_USERS.find(u => u.role === 'ADMIN') : DEMO_USERS.find(u => u.role === 'CITIZEN');
  const user = {
    id: `session-${role.toLowerCase()}-${Date.now().toString(36)}`,
    name: role === 'ADMIN' ? 'District Command Administrator' : 'Resident',
    role,
    state: template?.state || 'Assam',
    district: template?.district || 'Dibrugarh',
    language: req.body.language || 'en'
  };
  const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie(SESSION_COOKIE, token, cookieOpts());
  res.json({ success: true, user });
}

function csrf(req, res) {
  res.json({ success: true, csrfToken: issueCsrfToken(req, res) });
}

function logout(req, res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ success: true });
}

const me = (req, res) => res.json({ success: true, user: req.user });

module.exports = { login, register, selectRole, logout, me, csrf };
