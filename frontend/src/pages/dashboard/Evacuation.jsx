import React, { useEffect, useMemo, useState } from 'react';
import { Route, RouteOff, Users, Navigation, LocateFixed, Send, UserPlus, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';
import { useAuth, useOpsData } from '../../context/AppProviders';
import { api, gmapsDirections, haversineKm, etaMinutes } from '../../lib/api';
import { Panel, PanelHeader, Badge, EmptyState, Button, PageHeader, SeverityBadge } from '../../components/ui';

function locationDistance(team, position) {
  if (!position || !team?.latitude || !team?.longitude) return null;
  return haversineKm(position.lat, position.lng, team.latitude, team.longitude);
}

function ResidentEvacuation({ ops }) {
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [requested, setRequested] = useState(false);
  const evacuations = ops.data?.evacuations || [];
  const shelters = ops.data?.shelters || [];
  const teams = ops.data?.resources || [];

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => { setPosition({lat:p.coords.latitude,lng:p.coords.longitude}); setLocating(false); }, () => setLocating(false), {enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  }

  useEffect(() => { locate(); }, []);

  async function requestEvacuation() {
    setRequested(true);
    try {
      await api('/citizen-reports', { method:'post', data:{ type:'EVACUATION_REQUEST', immediate:false, latitude:position?.lat, longitude:position?.lng, peopleAffected:1, description:'I need evacuation assistance' } });
      ops.refresh();
    } finally { setRequested(false); }
  }

  return <div className="space-y-5">
    <PageHeader eyebrow={`${ops.district} · ${ops.state}`} title="Evacuation assistance" action={<Button variant="outline" onClick={locate} disabled={locating}><LocateFixed size={15}/>{locating?'Locating':'Update location'}</Button>} />
    {evacuations.length === 0 ? <Panel><EmptyState icon={RouteOff} title="No active evacuation order" subtitle="You can still request assistance if you cannot move safely."/></Panel> : <div className="space-y-4">
      {evacuations.filter(e => e.status !== 'COMPLETED').map(e => {
        const shelter = typeof e.targetShelter === 'object' ? e.targetShelter : shelters.find(s=>s._id===e.targetShelter);
        const assigned = (e.assignedTeams || []).map(t => typeof t === 'object' ? t : teams.find(r=>r._id===t)).filter(Boolean);
        const nearestTeam = [...assigned].map(t=>({...t,distance:locationDistance(t,position)})).sort((a,b)=>(a.distance??999)-(b.distance??999))[0];
        const progress = e.population ? Math.round((e.evacuated||0)/e.population*100) : 0;
        return <Panel key={e._id} className="border-t-2 border-t-signal-blue">
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black">{e.zone}</h3><SeverityBadge level={e.priority || 'MODERATE'}/><Badge tone="info">{e.status}</Badge></div><p className="mt-1 text-xs text-slate-500 dark:text-navy-300">Move to {shelter?.name || e.targetShelterName || 'assigned shelter'}</p></div>{shelter?.latitude ? <a href={gmapsDirections(shelter.latitude,shelter.longitude,position?.lat,position?.lng)} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-signal-blue px-4 py-2 text-xs font-black text-white"><Navigation size={14}/> Open route</a> : null}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3 dark:bg-navy-950"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">People to move</p><p className="mt-1 text-lg font-black">{e.population || 0}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-navy-950"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Moved</p><p className="mt-1 text-lg font-black">{e.evacuated || 0}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-navy-950"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Shelter space</p><p className="mt-1 text-lg font-black">{shelter ? Math.max(0,(shelter.capacity||0)-(shelter.occupancy||0)) : 'Check route'}</p></div></div>
            <div className="mt-4"><div className="flex items-center justify-between text-xs font-bold"><span>Evacuation progress</span><span>{progress}%</span></div><div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-navy-800"><div className="h-full rounded-full bg-signal-teal" style={{width:`${progress}%`}}/></div></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">{nearestTeam ? <div className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><div className="flex items-center gap-2"><div className="rounded-xl bg-signal-blue/10 p-2 text-signal-blue"><Navigation size={16}/></div><div><p className="text-xs font-black">Evacuation team</p><p className="text-xs text-slate-500">{nearestTeam.name} · {nearestTeam.type?.replaceAll('_',' ')}</p></div></div><p className="mt-3 text-sm font-black">{nearestTeam.distance != null ? `${nearestTeam.distance.toFixed(1)} km away` : 'Location sharing unavailable'}</p><p className="mt-1 text-xs text-slate-500">{nearestTeam.distance != null ? `Estimated ${etaMinutes(nearestTeam.distance)} min` : 'Allow location access to see distance'}</p></div> : <div className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><div className="flex items-center gap-2"><ShieldAlert size={18} className="text-signal-amber"/><p className="text-xs font-black">Team not assigned yet</p></div><p className="mt-2 text-xs text-slate-500">Follow the shelter route and watch for the next response update.</p></div>}
              {shelter ? <div className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><p className="text-xs font-black">Shelter readiness</p><div className="mt-2 flex flex-wrap gap-2">{shelter.food && <Badge tone="safe">Food</Badge>}{shelter.water && <Badge tone="safe">Water</Badge>}{shelter.medical && <Badge tone="safe">Medical</Badge>}{shelter.accessibility && <Badge tone="safe">Accessible</Badge>}</div><p className="mt-2 text-xs text-slate-500">{Math.max(0,(shelter.capacity||0)-(shelter.occupancy||0))} spaces currently available</p></div> : null}</div>
          </div>
        </Panel>;
      })}
    </div>}
    <Panel className="border-t-2 border-t-signal-red"><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black">Need a rescue team?</p><p className="mt-1 text-xs text-slate-500 dark:text-navy-300">Send your current location to the district response queue.</p></div><Button variant="outline" onClick={requestEvacuation} disabled={requested || !position}><Send size={14}/>{requested?'Sending':position?'Request evacuation':'Use location first'}</Button></div></Panel>
  </div>;
}

function AdminEvacuation({ ops }) {
  const evacuations = ops.data?.evacuations || [];
  const shelters = ops.data?.shelters || [];
  const resources = ops.data?.resources || [];
  const [selected, setSelected] = useState({});
  const [form, setForm] = useState({ zone:'', population:20, shelterId:'' });
  const [busy, setBusy] = useState('');

  const availableTeams = resources.filter(r => r.status === 'AVAILABLE');

  async function createOperation() {
    if (!form.zone || !form.shelterId || Number(form.population) < 1) return;
    setBusy('create');
    try { await api('/evacuations/activate', {method:'post', data:{...form, population:Number(form.population), state:ops.state, district:ops.district, priority:'HIGH'}}); setForm({zone:'',population:20,shelterId:''}); ops.refresh(); }
    finally { setBusy(''); }
  }

  async function assignTeam(evId, teamId) {
    if (!teamId) return;
    setBusy(`team:${evId}`);
    try { await api(`/evacuations/${evId}/assign-team`, {method:'post', data:{resourceId:teamId}}); ops.refresh(); }
    finally { setBusy(''); }
  }

  async function updateProgress(ev, delta, status) {
    const next = Math.max(0, Math.min(ev.population || 0, Number(ev.evacuated || 0) + delta));
    setBusy(`progress:${ev._id}`);
    try { await api(`/evacuations/${ev._id}`, {method:'patch', data:{evacuated:next, status: status || (next >= ev.population ? 'COMPLETED' : 'ACTIVE')}}); ops.refresh(); }
    finally { setBusy(''); }
  }

  return <div className="space-y-5">
    <PageHeader eyebrow={`National operations · ${ops.district} · ${ops.state}`} title="Evacuation operations" action={<Badge tone="info">{evacuations.filter(e=>e.status!=='COMPLETED').length} active</Badge>} />
    <Panel className="border-t-2 border-t-signal-blue"><PanelHeader title="Start evacuation operation"/><div className="grid gap-3 p-5 md:grid-cols-[1.2fr_.6fr_1fr_auto]"><input value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})} placeholder="Affected zone" className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none dark:border-navy-700 dark:bg-navy-950"/><input type="number" min="1" value={form.population} onChange={e=>setForm({...form,population:e.target.value})} placeholder="People" className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none dark:border-navy-700 dark:bg-navy-950"/><select value={form.shelterId} onChange={e=>setForm({...form,shelterId:e.target.value})} className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none dark:border-navy-700 dark:bg-navy-950"><option value="">Select shelter</option>{shelters.map(s=><option key={s._id} value={s._id}>{s.name} · {Math.max(0,(s.capacity||0)-(s.occupancy||0))} free</option>)}</select><Button onClick={createOperation} disabled={busy==='create'}><Route size={14}/>{busy==='create'?'Creating':'Create operation'}</Button></div></Panel>

    <div className="space-y-4">{evacuations.length===0?<Panel><EmptyState icon={Route} title="No evacuation operation" subtitle="Create an operation when a zone needs coordinated movement."/></Panel>:evacuations.map(ev=>{
      const shelter = typeof ev.targetShelter === 'object' ? ev.targetShelter : shelters.find(s=>s._id===ev.targetShelter);
      const assigned = (ev.assignedTeams||[]).map(t=>typeof t==='object'?t:resources.find(r=>r._id===t)).filter(Boolean);
      const remaining = Math.max(0,(ev.population||0)-(ev.evacuated||0));
      return <Panel key={ev._id} className="border-t-2 border-t-signal-blue"><div className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black">{ev.zone}</h3><SeverityBadge level={ev.priority||'MODERATE'}/><Badge tone={ev.status==='COMPLETED'?'safe':ev.status==='ACTIVE'?'info':'warn'}>{ev.status}</Badge></div><p className="mt-1 text-xs text-slate-500">Target shelter: {shelter?.name || ev.targetShelterName || 'Not assigned'}</p></div><div className="text-right"><p className="text-lg font-black">{ev.evacuated||0}/{ev.population||0}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">People moved</p></div></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><div className="flex items-center justify-between"><p className="text-xs font-black">Assigned teams</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{assigned.length} active</p></div>{assigned.length ? <div className="mt-3 space-y-2">{assigned.map(t=><div key={t._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-navy-950"><div><p className="text-xs font-bold">{t.name}</p><p className="text-[10px] text-slate-500">{t.type?.replaceAll('_',' ')} · {t.status}</p></div><p className="text-[10px] font-black text-signal-teal">{t.status==='EN_ROUTE'?'EN ROUTE':'ASSIGNED'}</p></div>)}</div> : <p className="mt-3 text-xs text-slate-500">No team assigned</p>}
            <div className="mt-3 flex gap-2"><select value={selected[ev._id]||''} onChange={e=>setSelected({...selected,[ev._id]:e.target.value})} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-300 px-2 text-xs outline-none dark:border-navy-700 dark:bg-navy-950"><option value="">Select available team</option>{availableTeams.map(t=><option key={t._id} value={t._id}>{t.name} · {t.type?.replaceAll('_',' ')}</option>)}</select><Button onClick={()=>assignTeam(ev._id,selected[ev._id])} disabled={!selected[ev._id] || busy===`team:${ev._id}`}><UserPlus size={14}/> Assign</Button></div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-navy-700"><div className="flex items-center justify-between"><p className="text-xs font-black">Evacuation progress</p><Badge tone={remaining===0?'safe':'info'}>{remaining} remaining</Badge></div><div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-navy-800"><div className="h-full rounded-full bg-signal-teal" style={{width:`${ev.population ? Math.min(100,Math.round(ev.evacuated/ev.population*100)) : 0}%`}}/></div><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onClick={()=>updateProgress(ev,1)} disabled={remaining===0 || busy===`progress:${ev._id}`}><Users size={14}/> Mark one moved</Button><Button onClick={()=>updateProgress(ev,remaining,remaining===0?'COMPLETED':undefined)} disabled={remaining===0 || busy===`progress:${ev._id}`}><CheckCircle2 size={14}/> Complete movement</Button></div></div>
        </div>
      </div></Panel>;
    })}</div>
  </div>;
}

export default function Evacuation() {
  const auth = useAuth();
  const ops = useOpsData();
  return auth.isAdmin ? <AdminEvacuation ops={ops}/> : <ResidentEvacuation ops={ops}/>;
}
