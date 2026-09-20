const express = require('express');
const { body, validationResult } = require('express-validator');
const r = express.Router();
const c = require('../controllers/coreController');
const { protect, permit } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
};

r.use(protect);
r.get('/districts', c.list);
r.get('/dashboard', c.dashboard);
r.get('/weather', c.getWeather);
r.get('/demo/dashboard', c.demoDashboard);

const readOnly = ['districts', 'incidents', 'resources', 'shelters', 'alerts', 'roads', 'evacuations', 'notifications', 'reports', 'simulations', 'gauges', 'infrastructure', 'floodzones', 'emergencycontacts', 'meshnodes'];
readOnly.forEach(k => r.get('/' + k, c.list));

const writable = ['incidents', 'resources', 'shelters', 'alerts', 'roads', 'notifications', 'simulations', 'meshnodes'];
writable.forEach(k => {
  r.post('/' + k, permit('ADMIN', 'DISTRICT_OFFICER'), c.create);
  r.patch('/' + k + '/:id', permit('ADMIN', 'DISTRICT_OFFICER', 'FIELD_RESPONDER'), c.update);
});
r.patch('/reports/:id', permit('ADMIN', 'DISTRICT_OFFICER'), c.update);
r.patch('/evacuations/:id', permit('ADMIN', 'DISTRICT_OFFICER'), c.updateEvacuation);
r.post('/evacuations/:id/assign-team', permit('ADMIN', 'DISTRICT_OFFICER'), c.assignEvacuationTeam);
r.post('/incidents/:id/dispatch', permit('ADMIN', 'DISTRICT_OFFICER'), c.dispatch);

// Citizen / resident SOS intake — validated and length-capped since this is the
// one write path reachable by an unprivileged, high-volume role.
r.post('/citizen-reports',
  permit('CITIZEN'),
  body('type').optional().isString().isLength({ max: 40 }),
  body('description').optional().isString().isLength({ max: 800 }),
  body('rawText').optional().isString().isLength({ max: 800 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('peopleAffected').optional().isInt({ min: 1, max: 500 }),
  validate,
  c.createCitizenReport
);

r.post('/evacuations/activate', permit('ADMIN', 'DISTRICT_OFFICER'), c.evacuate);
r.post('/simulations/run', permit('ADMIN', 'DISTRICT_OFFICER'), c.simulation);

module.exports = r;
