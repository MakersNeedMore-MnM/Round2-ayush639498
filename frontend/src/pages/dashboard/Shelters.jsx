import React, { useMemo, useState } from 'react';
import { Warehouse, Droplet, Utensils, Stethoscope, Accessibility, PhoneCall, MapPin, Navigation, LocateFixed, Search, Save, X } from 'lucide-react';
import { useOpsData, useAuth } from '../../context/AppProviders';
import { api, gmapsDirections, haversineKm } from '../../lib/api';
import { Panel, Badge, EmptyState, Button, PageHeader } from '../../components/ui';

function serviceLabel(active, label) {
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-signal-teal/10 text-signal-teal' : 'bg-slate-100 text-slate-400 dark:bg-navy-800 dark:text-navy-500'}`}>{label}</span>;
}

function ResidentShelters({ shelters, ops }) {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  function locate() {
    if (!navigator.geolocation) { setLocationError('Location is not available on this device'); return; }
    setLocating(true); setLocationError('');
    navigator.geolocation.getCurrentPosition(
      p => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => { setLocating(false); setLocationError('Allow location access to sort by distance and open a route from you'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const list = useMemo(() => shelters
    .filter(s => `${s.name} ${s.location || ''}`.toLowerCase().includes(query.toLowerCase()))
    .map(s => ({ ...s, distance: position ? haversineKm(position.lat, position.lng, s.latitude, s.longitude) : null }))
    .sort((a, b) => position ? (a.distance ?? 999) - (b.distance ?? 999) : (a.occupancy / Math.max(1, a.capacity)) - (b.occupancy / Math.max(1, b.capacity))), [shelters, query, position]);

  return <div className="space-y-5">
    <PageHeader eyebrow={`${ops.district} · ${ops.state}`} title="Evacuation shelters" action={<Button variant="outline" onClick={locate} disabled={locating}><LocateFixed size={15}/>{locating ? 'Locating' : 'Use my location'}</Button>} />
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-navy-700 dark:bg-navy-900"><Search size={16} className="text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search shelter name or area" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
      {locationError ? <div className="rounded-xl bg-signal-red/10 px-3 py-2 text-xs font-semibold text-signal-red">{locationError}</div> : null}
    </div>
    {list.length === 0 ? <Panel><EmptyState icon={Warehouse} title="No shelter found" subtitle="Try another name or area."/></Panel> : <div className="space-y-4">
      {list.map(s => {
        const pct = s.capacity ? Math.min(100, Math.round((s.occupancy || 0) / s.capacity * 100)) : 0;
        const bar = pct >= 90 ? 'bg-signal-red' : pct >= 65 ? 'bg-signal-amber' : 'bg-signal-teal';
        const mapsUrl = gmapsDirections(s.latitude, s.longitude, position?.lat, position?.lng);
        return <Panel key={s._id} className="border-t-2 border-t-signal-blue">
          <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-navy-950 dark:text-white">{s.name}</h3><Badge tone={s.status === 'OPEN' ? 'safe' : s.status === 'FULL' ? 'danger' : 'warn'}>{s.status}</Badge></div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-navy-300"><span className="inline-flex items-center gap-1"><MapPin size={13}/>{s.distance != null ? `${s.distance.toFixed(1)} km away` : `${ops.district}`}</span>{s.contact ? <a href={`tel:${s.contact}`} className="inline-flex items-center gap-1 font-bold text-signal-blue"><PhoneCall size={13}/>Call</a> : null}</div>
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-signal-blue px-4 py-2 text-xs font-black text-white shadow-sm"><Navigation size={14}/> Get directions</a>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-500 dark:text-navy-300">Occupancy</span><span className="font-black text-navy-900 dark:text-white">{s.occupancy || 0}/{s.capacity || 0} <span className="ml-2">{pct}%</span></span></div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-navy-800"><div className={`h-full rounded-full ${bar}`} style={{width:`${pct}%`}}/></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{serviceLabel(s.food,'Food')}{serviceLabel(s.water,'Water')}{serviceLabel(s.medical,'Medical')}{serviceLabel(s.accessibility,'Accessible')}</div>
          </div>
        </Panel>;
      })}
    </div>}
  </div>;
}

function AdminShelters({ shelters, ops }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  function openEdit(s) {
    setEditing({ ...s, occupancy: s.occupancy || 0, capacity: s.capacity || 0, food: !!s.food, water: !!s.water, medical: !!s.medical, accessibility: !!s.accessibility });
  }

  async function persist() {
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/shelters/${editing._id}`, { method: 'patch', data: { occupancy: Number(editing.occupancy), capacity: Number(editing.capacity), food: editing.food, water: editing.water, medical: editing.medical, accessibility: editing.accessibility } });
      setEditing(null); ops.refresh();
    } finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <PageHeader eyebrow={`${ops.district} · ${ops.state}`} title="Shelter network" action={<span className="text-xs font-bold text-slate-500 dark:text-navy-300">{shelters.length} shelters</span>} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {shelters.map(s => {
        const pct = s.capacity ? Math.min(100, Math.round((s.occupancy || 0) / s.capacity * 100)) : 0;
        const bar = pct >= 90 ? 'bg-signal-red' : pct >= 65 ? 'bg-signal-amber' : 'bg-signal-blue';
        return <Panel key={s._id} className="border-t-2 border-t-signal-blue">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black">{s.name}</h3><p className="mt-1 text-[11px] text-slate-500 dark:text-navy-300">{s.contact || 'No contact listed'}</p></div><Badge tone={s.status === 'OPEN' ? 'safe' : s.status === 'FULL' ? 'danger' : 'warn'}>{s.status}</Badge></div>
            <div className="mt-4 flex items-end justify-between"><div><span className="text-2xl font-black">{s.occupancy || 0}</span><span className="ml-1 text-xs text-slate-500">/ {s.capacity || 0} occupied</span></div><span className="text-sm font-black">{pct}%</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-navy-800"><div className={`h-full rounded-full ${bar}`} style={{width:`${pct}%`}}/></div>
            <div className="mt-3 flex flex-wrap gap-2">{serviceLabel(s.food,'Food')}{serviceLabel(s.water,'Water')}{serviceLabel(s.medical,'Medical')}{serviceLabel(s.accessibility,'Accessible')}</div>
            <Button variant="outline" className="mt-4 w-full" onClick={()=>openEdit(s)}><Save size={14}/> Update shelter</Button>
          </div>
        </Panel>;
      })}
    </div>
    {editing ? <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-navy-950/60 p-4" onClick={()=>setEditing(null)}><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-navy-900" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Shelter update</p><h3 className="mt-1 text-lg font-black">{editing.name}</h3></div><button onClick={()=>setEditing(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-navy-800"><X size={18}/></button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Occupancy<input type="number" min="0" value={editing.occupancy} onChange={e=>setEditing({...editing,occupancy:e.target.value})} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 outline-none dark:border-navy-700 dark:bg-navy-950"/></label><label className="text-xs font-bold">Capacity<input type="number" min="1" value={editing.capacity} onChange={e=>setEditing({...editing,capacity:e.target.value})} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 outline-none dark:border-navy-700 dark:bg-navy-950"/></label></div>
      <div className="mt-4 grid grid-cols-2 gap-2">{[['food','Food'],['water','Water'],['medical','Medical'],['accessibility','Accessible']].map(([key,label])=><button key={key} onClick={()=>setEditing({...editing,[key]:!editing[key]})} className={`rounded-xl border px-3 py-3 text-left text-xs font-black ${editing[key]?'border-signal-teal bg-signal-teal/10 text-signal-teal':'border-slate-200 dark:border-navy-700'}`}>{label}<span className="float-right">{editing[key]?'ON':'OFF'}</span></button>)}</div>
      <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditing(null)}>Cancel</Button><Button onClick={persist} disabled={saving}>{saving?'Saving':'Save changes'}</Button></div>
    </div></div> : null}
  </div>;
}

export default function Shelters() {
  const ops = useOpsData();
  const auth = useAuth();
  const shelters = ops.data?.shelters || [];
  return auth.isAdmin ? <AdminShelters shelters={shelters} ops={ops}/> : <ResidentShelters shelters={shelters} ops={ops}/>;
}
