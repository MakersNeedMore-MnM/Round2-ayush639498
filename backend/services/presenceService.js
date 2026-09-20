// Keeps a lightweight, in-memory map of each connected socket's last known
// location so an emergency report can alert nearby app users in real time.
// This never persists to the database and is cleared on disconnect — it is
// purely a live routing table for the 'sos:nearby' broadcast.
const locations = new Map(); // socketId -> { lat, lng, userId, name, updatedAt }

const STALE_MS = 30 * 60 * 1000; // ignore a location ping older than 30 minutes

function pruneStale() {
  const cutoff = Date.now() - STALE_MS;
  locations.forEach((loc, socketId) => { if (loc.updatedAt < cutoff) locations.delete(socketId); });
}

function setLocation(socketId, loc, user) {
  const lat = Number(loc?.lat), lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
  locations.set(socketId, { lat, lng, userId: user?.id || user?._id, name: user?.name, updatedAt: Date.now() });
}

function clearLocation(socketId) {
  locations.delete(socketId);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Emits `event` with `payload` (plus a computed distanceKm) to every socket
// whose last known location is within radiusKm of (lat, lng). Returns how
// many sockets were notified.
function notifyNearby(io, lat, lng, radiusKm, event, payload, excludeUserId) {
  const originLat = Number(lat), originLng = Number(lng);
  if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) return 0;
  pruneStale();
  let notified = 0;
  locations.forEach(function checkSocket(loc, socketId) {
    if (excludeUserId && loc.userId && String(loc.userId) === String(excludeUserId)) return;
    const distanceKm = haversineKm(originLat, originLng, loc.lat, loc.lng);
    if (distanceKm <= radiusKm) {
      io.to(socketId).emit(event, { ...payload, distanceKm: Math.round(distanceKm * 10) / 10 });
      notified += 1;
    }
  });
  return notified;
}

module.exports = { setLocation, clearLocation, notifyNearby };
