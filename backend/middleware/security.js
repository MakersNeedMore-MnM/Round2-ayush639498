// Recursively strip HTML/script content and dangerous Mongo operator keys from any
// user supplied value. Runs on body, query and params. This is a defense-in-depth
// layer in addition to express-mongo-sanitize (Mongo operator injection) and
// schema-level validation (express-validator) on individual routes.
const SCRIPT_TAG = /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const HTML_TAG = /<[^>]*>/g;
function cleanString(v) {
  if (typeof v !== 'string') return v;
  return v.replace(SCRIPT_TAG, '').replace(HTML_TAG, '').trim();
}
function deepClean(obj, depth = 0) {
  if (depth > 8 || obj == null) return obj;
  if (typeof obj === 'string') return cleanString(obj);
  if (Array.isArray(obj)) return obj.map(v => deepClean(v, depth + 1));
  if (typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      // reject keys that look like Mongo operators or prototype-pollution attempts
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      out[key] = deepClean(obj[key], depth + 1);
    }
    return out;
  }
  return obj;
}
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = deepClean(req.body);
  if (req.query && typeof req.query === 'object') {
    const cleaned = deepClean(req.query);
    Object.keys(req.query).forEach(k => delete req.query[k]);
    Object.assign(req.query, cleaned);
  }
  if (req.params && typeof req.params === 'object') req.params = deepClean(req.params);
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Audit-friendly structured logging for every state changing / privileged request.
// Never logs request bodies (may contain personal/location data) — only actor,
// action shape and outcome, which keeps this safe to retain and review.
function auditLog(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const start = Date.now();
  res.on('finish', () => {
    const entry = {
      at: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - start,
      userId: req.user?._id || req.user?.id || 'anonymous',
      role: req.user?.role || 'none',
      ip: req.ip
    };
    console.log('[AUDIT]', JSON.stringify(entry));
  });
  next();
}

module.exports = { sanitizeInput, auditLog };
