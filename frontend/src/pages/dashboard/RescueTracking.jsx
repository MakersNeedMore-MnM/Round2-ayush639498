import React, { useMemo } from 'react';
import { Truck, Navigation, Clock3, Siren, Route, CheckCircle2 } from 'lucide-react';
import { useOpsData } from '../../context/AppProviders';
import { Panel, PanelHeader, StatCard, PageHeader, Badge, SeverityBadge } from '../../components/ui';
import { haversineKm, etaMinutes } from '../../lib/api';

export default function RescueTracking() {
  const ops = useOpsData();
  const resources = ops.data?.resources || [];
  const incidents = ops.data?.incidents || [];
  const active = resources.filter(r=>['BUSY','EN_ROUTE'].includes(r.status));
  const missions = incidents.filter(i=>['ASSIGNED','IN_PROGRESS'].includes(i.status));
  const avgEta = useMemo(()=>{const d=ops.data||{};const rows=active.map(r=>{if(r.assignedIncident){const i=(d.incidents||[]).find(x=>String(x._id)===String(r.assignedIncident));if(i?.latitude&&i?.longitude&&r.latitude&&r.longitude)return etaMinutes(haversineKm(r.latitude,r.longitude,i.latitude,i.longitude));}if(r.assignedEvacuation){const e=(d.evacuations||[]).find(x=>String(x._id)===String(r.assignedEvacuation));const s=typeof e?.targetShelter==='object'?e.targetShelter:(d.shelters||[]).find(x=>String(x._id)===String(e?.targetShelter));if(s?.latitude&&s?.longitude&&r.latitude&&r.longitude)return etaMinutes(haversineKm(r.latitude,r.longitude,s.latitude,s.longitude));}return null;}).filter(x=>x!=null);return rows.length?Math.round(rows.reduce((a,b)=>a+b,0)/rows.length):0;},[active,ops.data]);
  return <div className="space-y-5">
    <PageHeader eyebrow={`National operations · ${ops.district} · ${ops.state}`} title="Rescue tracking" action={<Badge tone="safe">Live tracking</Badge>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Active units" value={active.length} icon={Truck}/><StatCard label="En route" value={active.filter(r=>r.status==='EN_ROUTE').length} icon={Navigation} tone="warn"/><StatCard label="Assigned missions" value={missions.length} icon={Siren} tone="danger"/><StatCard label="Average response" value={avgEta||'0'} suffix="min" icon={Clock3} tone="safe"/></div>
    <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <Panel><PanelHeader title="Rescue unit board" action={<span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Live</span>}/>{resources.length?<div className="divide-y divide-slate-100 dark:divide-navy-800">{resources.map(r=><div key={r._id} className="flex items-center justify-between gap-4 px-5 py-3.5"><div className="flex min-w-0 items-center gap-3"><div className="rounded-xl bg-signal-blue/10 p-2 text-signal-blue"><Truck size={15}/></div><div className="min-w-0"><p className="truncate text-xs font-black">{r.name}</p><p className="truncate text-[10px] text-slate-500">{r.type?.replaceAll('_',' ')} · {r.status}</p></div></div><div className="text-right"><p className="text-xs font-black">{r.status==='AVAILABLE'?'STANDBY':r.status==='EN_ROUTE'?'EN ROUTE':'ACTIVE'}</p><p className="text-[10px] text-slate-400">Elapsed live</p></div></div>)}</div>:null}</Panel>
      <Panel><PanelHeader title="Mission timeline" action={<Route size={15}/>}/>{missions.length?<div className="divide-y divide-slate-100 dark:divide-navy-800">{missions.slice(0,10).map(i=><div key={i._id} className="p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black">{i.code} · {i.status.replaceAll('_',' ')}</p><SeverityBadge level={i.severity}/></div><p className="mt-1 text-xs text-slate-500">{i.type?.replaceAll('_',' ')} near {i.location||i.zone||'district area'}</p><div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400"><CheckCircle2 size={12}/>{i.assignedResource?'Resource assigned':'Awaiting dispatch'}</div></div>)}</div>:<div className="p-6 text-center text-xs text-slate-500">No active rescue mission.</div>}</Panel>
    </div>
  </div>;
}
