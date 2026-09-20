import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useOpsData, useTheme } from '../../context/AppProviders';
import { districtCenter } from '../../data/geo';
import { Panel, PanelHeader, MapAutoSize } from '../../components/ui';

const LAYERS = [
  { key: 'incidents', label: 'Incidents', color: '#b3261e' },
  { key: 'resources', label: 'Response units', color: '#1a4a8c' },
  { key: 'shelters', label: 'Shelters', color: '#0f6d5c' },
  { key: 'roads', label: 'Roads', color: '#a15c00' },
  { key: 'infrastructure', label: 'Infrastructure', color: '#325780' },
  { key: 'gauges', label: 'River gauges', color: '#22436a' }
];

export default function LiveMap() {
  const ops = useOpsData();
  const theme = useTheme();
  const d = ops.data;
  const [active, setActive] = useState({ incidents: true, resources: true, shelters: true, roads: true, infrastructure: false, gauges: false });
  const center = d?.district?.center ? [d.district.center.lat, d.district.center.lng] : (function fallback() { const c = districtCenter(ops.state, ops.district); return [c.lat, c.lng]; })();

  function toggle(key) {
    setActive(function next(prev) { return { ...prev, [key]: !prev[key] }; });
  }

  const tileUrl = theme.theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">Live Response Map</h1>
        <p className="text-sm text-slate-500 dark:text-navy-300">{ops.district}, {ops.state}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LAYERS.map(function renderToggle(l) {
          return (
            <button
              key={l.key}
              onClick={function onClick() { toggle(l.key); }}
              className={'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ' + (active[l.key] ? 'border-navy-900 bg-navy-900 text-white dark:border-white dark:bg-white dark:text-navy-950' : 'border-slate-300 text-navy-700 dark:border-navy-700 dark:text-navy-200')}
            >
              <span className="h-2 w-2" style={{ background: l.color }} />
              {l.label}
            </button>
          );
        })}
      </div>

      <Panel className="relative z-0 h-[600px] min-w-0 overflow-hidden">
        <MapContainer center={center} zoom={12} className="h-full w-full">
          <MapAutoSize />
          <TileLayer url={tileUrl} />
          {active.incidents && (d?.incidents || []).map(function renderIncident(i) {
            return i.latitude && i.longitude ? (
              <CircleMarker key={i._id} center={[i.latitude, i.longitude]} radius={i.severity === 'CRITICAL' ? 9 : 6} pathOptions={{ color: '#b3261e', fillColor: '#b3261e', fillOpacity: 0.85, weight: 1 }}>
                <Popup>
                  <p className="font-bold">{i.code}</p>
                  <p>{(i.type || '').replaceAll('_', ' ')} — {i.severity}</p>
                  <p>{i.location}</p>
                </Popup>
              </CircleMarker>
            ) : null;
          })}
          {active.resources && (d?.resources || []).map(function renderResource(r) {
            return r.latitude && r.longitude ? (
              <CircleMarker key={r._id} center={[r.latitude, r.longitude]} radius={5} pathOptions={{ color: '#1a4a8c', fillColor: '#1a4a8c', fillOpacity: 0.8, weight: 1 }}>
                <Popup><p className="font-bold">{r.name}</p><p>{r.type} — {r.status}</p></Popup>
              </CircleMarker>
            ) : null;
          })}
          {active.shelters && (d?.shelters || []).map(function renderShelter(s) {
            return s.latitude && s.longitude ? (
              <CircleMarker key={s._id} center={[s.latitude, s.longitude]} radius={6} pathOptions={{ color: '#0f6d5c', fillColor: '#0f6d5c', fillOpacity: 0.8, weight: 1 }}>
                <Popup><p className="font-bold">{s.name}</p><p>{s.occupancy}/{s.capacity} — {s.status}</p></Popup>
              </CircleMarker>
            ) : null;
          })}
          {active.roads && (d?.roads || []).map(function renderRoad(r) {
            return r.latitude && r.longitude ? (
              <CircleMarker key={r._id} center={[r.latitude, r.longitude]} radius={4} pathOptions={{ color: '#a15c00', fillColor: r.status === 'OPEN' ? '#0f6d5c' : '#a15c00', fillOpacity: 0.75, weight: 1 }}>
                <Popup><p className="font-bold">{r.name}</p><p>{r.status}</p></Popup>
              </CircleMarker>
            ) : null;
          })}
          {active.infrastructure && (d?.infrastructure || []).map(function renderInfra(x) {
            return x.latitude && x.longitude ? (
              <CircleMarker key={x._id} center={[x.latitude, x.longitude]} radius={5} pathOptions={{ color: '#325780', fillColor: '#325780', fillOpacity: 0.8, weight: 1 }}>
                <Popup><p className="font-bold">{x.name}</p><p>{x.type}</p></Popup>
              </CircleMarker>
            ) : null;
          })}
          {active.gauges && (d?.gauges || []).map(function renderGauge(g) {
            return g.latitude && g.longitude ? (
              <CircleMarker key={g._id} center={[g.latitude, g.longitude]} radius={6} pathOptions={{ color: '#22436a', fillColor: '#22436a', fillOpacity: 0.8, weight: 1 }}>
                <Popup><p className="font-bold">{g.station}</p><p>Level {g.waterLevel}m — {g.trend}</p></Popup>
              </CircleMarker>
            ) : null;
          })}
        </MapContainer>
      </Panel>
    </div>
  );
}
