const m = require('mongoose');
module.exports = m.model('MeshNode', new m.Schema({
  name: { type: String, required: true },
  nodeType: { type: String, enum: ['GATEWAY', 'RELAY', 'RESPONDER_DEVICE', 'SHELTER_HUB'], default: 'RELAY' },
  latitude: Number,
  longitude: Number,
  status: { type: String, enum: ['ONLINE', 'DEGRADED', 'OFFLINE'], default: 'ONLINE' },
  signalStrength: { type: Number, min: 0, max: 100, default: 80 },
  batteryPercent: { type: Number, min: 0, max: 100, default: 100 },
  connectedDevices: { type: Number, default: 0 },
  coverageRadiusKm: { type: Number, default: 1.5 },
  lastSeen: { type: Date, default: Date.now },
  state: { type: String, default: 'Assam' },
  district: { type: String, default: 'Dibrugarh' },
  sourceType: { type: String, default: 'OPERATOR' },
  sourceName: String
}, { timestamps: true }));
