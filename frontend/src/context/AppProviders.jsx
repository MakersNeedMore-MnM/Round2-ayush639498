import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, BASE } from '../lib/api';
import { DEFAULT_STATE, DEFAULT_DISTRICT, STATES } from '../data/geo';

// ---------- Theme ----------
const ThemeContext = createContext(null);
export function useTheme() {
  return useContext(ThemeContext);
}
export function ThemeProvider(props) {
  const [theme, setTheme] = useState(function initial() {
    const saved = localStorage.getItem('rashak-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(function applyTheme() {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('rashak-theme', theme);
  }, [theme]);
  function toggleTheme() {
    setTheme(function flip(t) { return t === 'dark' ? 'light' : 'dark'; });
  }
  const value = { theme, toggleTheme };
  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

// ---------- Auth ----------
const AuthContext = createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}
export function AuthProvider(props) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(function restoreSession() {
    api('/auth/me').then(function onOk(res) {
      setUser(res.data.user);
    }).catch(function onFail() {
      setUser(null);
    }).finally(function done() {
      setChecking(false);
    });
  }, []);

  const selectRole = useCallback(async function selectRole(role, accessCode, language) {
    const res = await api('/auth/role', { method: 'post', data: { role, accessCode, language } });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async function logout() {
    try { await api('/auth/logout', { method: 'post' }); } catch (e) { /* ignore */ }
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = useMemo(function build() {
    return { user, checking, selectRole, logout, isAdmin: ['ADMIN', 'DISTRICT_OFFICER'].includes(user?.role), isResident: user?.role === 'CITIZEN' };
  }, [user, checking, selectRole, logout]);

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

// ---------- Operational data (district selection, dashboard feed, sockets) ----------
const DataContext = createContext(null);
export function useOpsData() {
  return useContext(DataContext);
}
export function DataProvider(props) {
  const auth = useAuth();
  const [state, setState] = useState(function initial() {
    try { return JSON.parse(localStorage.getItem('rashak-state') || JSON.stringify(DEFAULT_STATE)); } catch { return DEFAULT_STATE; }
  });
  const [district, setDistrict] = useState(function initial() {
    return localStorage.getItem('rashak-district') || DEFAULT_DISTRICT;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(function persistState() {
    localStorage.setItem('rashak-state', JSON.stringify(state));
    if (!STATES[state]?.includes(district)) setDistrict(STATES[state]?.[0] || DEFAULT_DISTRICT);
  }, [state]);
  useEffect(function persistDistrict() {
    localStorage.setItem('rashak-district', district);
  }, [district]);

  const refresh = useCallback(function refresh() {
    if (!auth.user) return;
    setLoading(true);
    api('/dashboard', { params: { state, district } })
      .then(function onOk(res) { setData(res.data.data); })
      .catch(function onFail() { /* keep last known data on transient failure */ })
      .finally(function done() { setLoading(false); });
  }, [auth.user, state, district]);

  useEffect(function initialLoad() {
    refresh();
    const interval = setInterval(refresh, 45000);
    return function cleanup() { clearInterval(interval); };
  }, [refresh]);

  useEffect(function connectSocket() {
    if (!auth.user) return;
    const socket = io(BASE, { auth: { token: localStorage.getItem('token') || '' } });
    socket.on('connect', function onConnect() { setConnected(true); });
    socket.on('disconnect', function onDisconnect() { setConnected(false); });
    const events = ['incidents:updated', 'incident:new', 'incident:assigned', 'resources:updated', 'resource:dispatched', 'shelters:updated', 'shelter:updated', 'alerts:updated', 'roads:updated', 'road:blocked', 'road:cleared', 'evacuations:updated', 'evacuation:updated', 'meshnodes:updated'];
    events.forEach(function bind(evt) { socket.on(evt, refresh); });
    socket.on('notification:new', function onNotif(n) {
      setNotifications(function prepend(list) { return [{ id: Math.random().toString(36).slice(2), at: new Date(), ...n }, ...list].slice(0, 60); });
    });

    // Emergency proximity alert: the server pushes 'sos:nearby' to any
    // socket whose last shared location is close to a new SOS report. This
    // never runs a query on our side, it only reacts to what the server sends.
    socket.on('sos:nearby', function onNearby(n) {
      setNotifications(function prepend(list) {
        return [{ id: Math.random().toString(36).slice(2), at: new Date(), type: 'SOS_NEARBY', title: 'Emergency reported nearby', message: n.message + (n.distanceKm != null ? ' • about ' + n.distanceKm + ' km away' : ''), ...n }, ...list].slice(0, 60);
      });
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try { new Notification('Emergency reported nearby', { body: 'About ' + n.distanceKm + ' km away • ' + (n.type || '').replaceAll('_', ' ') }); } catch (e) { /* ignore */ }
      }
    });

    // Share this device's approximate location only so the server can route
    // the proximity alert above; nothing else reads this stream. Best effort:
    // silently does nothing if geolocation is unavailable or denied.
    let watchId = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(function ignore() {});
      }
      watchId = navigator.geolocation.watchPosition(
        function onPosition(pos) { socket.emit('presence:location', { lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        function onError() { /* location unavailable or denied, ignore */ },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
      );
    }

    return function cleanup() {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [auth.user, refresh]);

  const value = useMemo(function build() {
    return { state, district, setState, setDistrict, data, loading, connected, refresh, notifications };
  }, [state, district, data, loading, connected, refresh, notifications]);

  return <DataContext.Provider value={value}>{props.children}</DataContext.Provider>;
}
