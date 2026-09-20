const axios = require('axios');
const { fetchAlerts } = require('./dataSources/sachet.service');
const { fetchSources } = require('./dataSources/asdma.service');
const { fetchWarning } = require('./dataSources/imd.service');
const { getDistrict } = require('../config/districts');

const cache = new Map();
const TTL = 10 * 60 * 1000;
const key = (state, district) => `${state}::${district}`;
const now = () => Date.now();

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

async function openMeteo(state, district) {
  const cfg = getDistrict(state, district);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.center.lat}&longitude=${cfg.center.lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=precipitation_probability,precipitation,temperature_2m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const { data } = await withTimeout(axios.get(url), 5000);
  const c = data.current || {}, d = data.daily || {};
  return {
    district, state,
    temperature: c.temperature_2m,
    rainfallMm: Number(d.precipitation_sum?.[0] ?? c.precipitation ?? 0),
    precipitationProbability: Number(d.precipitation_probability_max?.[0] ?? 0),
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    condition: Number(d.precipitation_sum?.[0] ?? 0) > 30 ? 'Heavy Rain' : Number(d.precipitation_sum?.[0] ?? 0) > 5 ? 'Rain' : 'Clear / Cloudy',
    warningLevel: Number(d.precipitation_sum?.[0] ?? 0) >= 50 ? 'SEVERE' : Number(d.precipitation_sum?.[0] ?? 0) >= 25 ? 'WARNING' : Number(d.precipitation_sum?.[0] ?? 0) >= 10 ? 'WATCH' : 'NORMAL',
    sourceType: 'VERIFIED', source: 'Open-Meteo', sourceName: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', fetchedAt: new Date(),
    forecast: (d.time || []).map((x, i) => ({ day: i === 0 ? 'Today' : new Date(x).toLocaleDateString('en-IN', { weekday: 'short' }), rainfallMm: d.precipitation_sum?.[i] ?? 0, tempMax: d.temperature_2m_max?.[i], tempMin: d.temperature_2m_min?.[i], precipitationProbability: d.precipitation_probability_max?.[i] ?? 0 }))
  };
}


async function fetchEmergencyContacts(state, district) {
  const cfg = getDistrict(state, district);
  const query = `[out:json][timeout:8];(nwr["amenity"~"^(police|fire_station|hospital)$"]["phone"](around:30000,${cfg.center.lat},${cfg.center.lng});nwr["emergency"="ambulance"]["phone"](around:30000,${cfg.center.lat},${cfg.center.lng}););out center tags;`;
  const { data } = await withTimeout(axios.post('https://overpass-api.de/api/interpreter', query, {
    headers: { 'Content-Type': 'text/plain' }
  }), 10000);
  const rows = (data?.elements || []).map(x => {
    const tags = x.tags || {};
    const phone = String(tags.phone || tags['contact:phone'] || '').trim();
    const name = tags.name || 'Local emergency service';
    const category = tags.amenity === 'police' ? 'Police' : tags.amenity === 'fire_station' ? 'Fire & Rescue' : tags.emergency === 'ambulance' ? 'Ambulance' : 'Medical';
    return phone ? { name, category, phone, state, district, sourceType: 'VERIFIED', sourceName: 'OpenStreetMap', sourceUrl: 'https://www.openstreetmap.org/' } : null;
  }).filter(Boolean);
  return rows.filter((x, i, arr) => arr.findIndex(y => y.phone === x.phone) === i).slice(0, 8);
}

async function refresh(state, district) {
  const k = key(state, district);
  const previous = cache.get(k) || { alerts: [], weather: null, emergencyContacts: [], fetchedAt: null, sources: {} };
  if (previous.fetchedAt && now() - previous.fetchedAt < TTL) return previous;

  const result = { ...previous, fetchedAt: new Date(), sources: { ...previous.sources } };
  const tasks = [
    withTimeout(fetchAlerts(), 6000).then(alerts => {
      result.alerts = alerts.filter(a => {
        const area = String(a.affectedArea || '').toLowerCase();
        return !area || area.includes(district.toLowerCase()) || area.includes(state.toLowerCase());
      }).map(a => ({ ...a, district, state: state === 'Assam' ? state : (a.state || state) }));
      result.sources.sachet = { ok: true, fetchedAt: new Date() };
    }).catch(error => { result.sources.sachet = { ok: false, error: error.message }; }),
    openMeteo(state, district).then(weather => { result.weather = weather; result.sources.weather = { ok: true, fetchedAt: new Date() }; }).catch(error => { result.sources.weather = { ok: false, error: error.message }; }),
    fetchEmergencyContacts(state, district).then(contacts => { if (contacts.length) result.emergencyContacts = contacts; result.sources.emergencyContacts = { ok: true, fetchedAt: new Date(), count: contacts.length }; }).catch(error => { result.sources.emergencyContacts = { ok: false, error: error.message }; }),
    withTimeout(fetchSources(), 7000).then(pages => {
      const p = pages.find(x => x.sourceName === 'ASDMA Flood Report');
      if (p) {
        result.alerts = [...result.alerts, { _id: `ASDMA-${district}`, externalId: `ASDMA-${district}`, title: `ASDMA Assam Flood Report • ${district}`, description: p.pageText.slice(0, 900), severity: 'ADVISORY', district, state, issuedAt: p.fetchedAt, officialUrl: p.links?.[0]?.href || p.sourceUrl, sourceType: 'OFFICIAL', source: 'ASDMA', sourceName: 'ASDMA', sourceUrl: p.sourceUrl, verificationStatus: 'VERIFIED' }];
        result.sources.asdma = { ok: true, fetchedAt: new Date() };
      }
    }).catch(error => { result.sources.asdma = { ok: false, error: error.message }; })
  ];
  await Promise.allSettled(tasks);
  result.fetchedAt = new Date();
  cache.set(k, result);
  return result;
}

function getCached(state, district) { return cache.get(key(state, district)) || null; }
module.exports = { refresh, getCached };
