require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cron = require('node-cron');
const { Server } = require('socket.io');
const { connectDB, dbIsConnected } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { sanitizeInput, auditLog } = require('./middleware/security');
const { protect, permit, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const auth = require('./routes/authRoutes');
const core = require('./routes/coreRoutes');
const ai = require('./routes/aiRoutes');
const ingestion = require('./routes/ingestionRoutes');
const { refreshAll } = require('./services/ingestionService');
const { scrape } = require('./services/scraperService');
const { ensureDemoDatabase } = require('./services/demoSyncService');
const presenceService = require('./services/presenceService');

// Strict CORS allow list — a comma separated list of exact origins, never a
// wildcard, since the API is served with credentials (cookies).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PATCH'] } });

app.set('trust proxy', 1); // needed for correct client IP behind Render/other proxies (rate limiting, audit log)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...allowedOrigins],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'same-site' }
}));
app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(sanitizeInput);

// General API rate limit; a stricter one guards SOS / citizen-report creation
// specifically so the emergency intake channel can't be flooded.
app.use(rateLimit({ windowMs: 60000, max: 300, standardHeaders: true, legacyHeaders: false }));
const sosLimiter = rateLimit({ windowMs: 60000, max: 12, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many reports from this connection, please wait a moment' } });

app.use((req, res, next) => { req.io = io; next(); });
app.use('/api', auditLog);

app.get('/api/health', (req, res) => res.json({ success: true, service: 'Rashak', status: 'operational' }));

app.use('/api/auth', auth);
app.use('/api/citizen-reports', sosLimiter);
app.use('/api', core);
app.use('/api/ai', ai);
app.use('/api/ingestion', ingestion);

// Admin-only diagnostic tool — previously open to any caller, now requires an
// authenticated admin session and is rate limited like everything else.
app.post('/api/scraper/preview', protect, permit('ADMIN'), async (req, res) => {
  if (!req.body.url) return res.status(400).json({ success: false, message: 'url required' });
  try {
    const text = await scrape(req.body.url);
    res.json({ success: !!text, sourceType: 'SCRAPED', data: text || 'No public content available' });
  } catch (e) {
    res.status(502).json({ success: false, message: 'Unable to fetch source' });
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded.user || null;
    if (!socket.user?.role) return next(new Error('Invalid session'));
    next();
  } catch { next(new Error('Invalid or expired session')); }
});
io.on('connection', socket => {
  socket.emit('system:connected', { at: new Date() });
  // A device opts in to sharing its live location only to power the
  // 'sos:nearby' proximity alert below; nothing here is written to the
  // database and it is dropped the moment the socket disconnects.
  socket.on('presence:location', loc => presenceService.setLocation(socket.id, loc, socket.user));
  socket.on('disconnect', () => presenceService.clearLocation(socket.id));
});

(async () => {
  await connectDB();
  if (dbIsConnected()) {
    try {
      await ensureDemoDatabase();
      console.log('[DATA] Backend demo operational dataset verified');
    } catch (e) {
      console.warn('[DATA] Mongo demo sync failed; API will use backend memory fallback:', e.message);
    }
    if (process.env.AUTO_INGEST !== 'false') refreshAll().then(x => console.log('[INGEST] completed', JSON.stringify(x))).catch(e => console.warn('[INGEST]', e.message));
    cron.schedule(process.env.INGEST_CRON || '*/15 * * * *', () => refreshAll().catch(e => console.warn('[INGEST]', e.message)));
  } else {
    console.warn('[DATA] MongoDB unavailable — using populated in-memory operational dataset');
  }
  server.listen(process.env.PORT || 5000, () => console.log(`Rashak API running on ${process.env.PORT || 5000}`));
})();

app.use(notFound);
app.use(errorHandler);
