import React, { useEffect, useState } from 'react';
import { Radio, BatteryMedium, Users, Loader2, Signal } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import { useOpsData, useTheme, useAuth } from '../../context/AppProviders';
import { api } from '../../lib/api';
import { Panel, PanelHeader, Badge, EmptyState, StatCard, MapAutoSize } from '../../components/ui';

const STATUS_COLOR = { ONLINE: '#0f6d5c', DEGRADED: '#a15c00', OFFLINE: '#b3261e' };

export default function LocalMesh() {
  const ops = useOpsData();
  const theme = useTheme();
  const auth = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function load() {
    let cancelled = false;
    setLoading(true);
    api('/meshnodes', { params: { state: ops.state, district: ops.district } })
      .then(function onOk(res) { if (!cancelled) setNodes(res.data.data || res.data.items || []); })
      .catch(function onFail() { if (!cancelled) setNodes([]); })
      .finally(function done() { if (!cancelled) setLoading(false); });
    return function cleanup() { cancelled = true; };
  }, [ops.state, ops.district]);

  const online = nodes.filter(function f(n) { return n.status === 'ONLINE'; }).length;
  const offline = nodes.filter(function f(n) { return n.status === 'OFFLINE'; }).length;
  const totalDevices = nodes.reduce(function sum(a, n) { return a + (n.connectedDevices || 0); }, 0);
  const center = nodes[0] ? [nodes[0].latitude, nodes[0].longitude] : (ops.data?.district?.center ? [ops.data.district.center.lat, ops.data.district.center.lng] : [26.9, 94.9]);
  const tileUrl = theme.theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">Local Mesh Network</h1>
        <p className="text-sm text-slate-500 dark:text-navy-300">Offline capable relay nodes that keep SOS and status updates moving when cellular or internet connectivity drops</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-navy-300"><Loader2 size={16} className="animate-spin" /> Loading mesh network status</div>
      ) : nodes.length === 0 ? (
        <Panel><EmptyState icon={Radio} title="No mesh nodes registered" subtitle="No local mesh relay nodes have been deployed in this district yet." /></Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total nodes" value={nodes.length} icon={Radio} />
            <StatCard label="Online" value={online} icon={Signal} />
            <StatCard label="Offline" value={offline} icon={Radio} />
            <StatCard label="Connected devices" value={totalDevices} icon={Users} />
          </div>

          <Panel className="h-[420px] overflow-hidden">
            <MapContainer center={center} zoom={11} className="h-full w-full">
              <MapAutoSize />
              <TileLayer url={tileUrl} />
              {nodes.map(function renderNode(n) {
                if (!n.latitude || !n.longitude) return null;
                const color = STATUS_COLOR[n.status] || STATUS_COLOR.OFFLINE;
                return (
                  <React.Fragment key={n._id}>
                    <Circle center={[n.latitude, n.longitude]} radius={(n.coverageRadiusKm || 1.5) * 1000} pathOptions={{ color, fillColor: color, fillOpacity: 0.06, weight: 1 }} />
                    <CircleMarker center={[n.latitude, n.longitude]} radius={6} pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 1 }}>
                      <Popup>
                        <p className="font-bold">{n.name}</p>
                        <p>{n.nodeType.replaceAll('_', ' ')} — {n.status}</p>
                        <p>Signal {n.signalStrength}% · Battery {n.batteryPercent}%</p>
                        <p>{n.connectedDevices} connected devices</p>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </Panel>

          <Panel>
            <PanelHeader title="Mesh nodes" subtitle={auth.isAdmin ? 'Full node telemetry' : 'Nearby relay coverage'} />
            <ul className="divide-y divide-slate-100 dark:divide-navy-800">
              {nodes.map(function renderRow(n) {
                return (
                  <li key={n._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-navy-900 dark:text-white">{n.name}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-500">{n.nodeType.replaceAll('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-navy-300">
                      <span className="flex items-center gap-1"><Signal size={13} /> {n.signalStrength}%</span>
                      <span className="flex items-center gap-1"><BatteryMedium size={13} /> {n.batteryPercent}%</span>
                      <span className="flex items-center gap-1"><Users size={13} /> {n.connectedDevices}</span>
                      <Badge tone={n.status === 'ONLINE' ? 'safe' : n.status === 'DEGRADED' ? 'warn' : 'danger'}>{n.status}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}
