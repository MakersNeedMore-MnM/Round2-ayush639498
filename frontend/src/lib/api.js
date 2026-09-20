import axios from 'axios';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BASE = API.replace(/\/api\/?$/, '');

export async function api(path, opt = {}) {
  const token = localStorage.getItem('token');
  return axios({
    url: API + path,
    ...opt,
    headers: {
      ...(opt.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(v))) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function etaMinutes(km, kmh = 22) {
  if (km == null) return null;
  return Math.max(2, Math.round(km / kmh * 60));
}

export function gmapsDirections(destLat, destLng, originLat, originLng) {
  const dest = `${destLat},${destLng}`;
  return originLat != null
    ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dest}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

export const INDIA_BOUNDS = { latMin: 6.5, latMax: 36.0, lngMin: 68.0, lngMax: 97.5 };
export function projectIndia(lat, lng) {
  const x = (lng - INDIA_BOUNDS.lngMin) / (INDIA_BOUNDS.lngMax - INDIA_BOUNDS.lngMin) * 100;
  const y = (INDIA_BOUNDS.latMax - lat) / (INDIA_BOUNDS.latMax - INDIA_BOUNDS.latMin) * 100;
  return { x, y };
}
