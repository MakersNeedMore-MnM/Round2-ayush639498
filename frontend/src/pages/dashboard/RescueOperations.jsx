import React from 'react';
import { Ambulance, Anchor, Flame, RadioTower, PhoneCall, UserRound, Truck } from 'lucide-react';
import { useOpsData } from '../../context/AppProviders';
import { Panel, PageHeader, Badge, StatCard } from '../../components/ui';

const icons = { AMBULANCE: Ambulance, BOAT: Anchor, FIRE_UNIT: Flame, RESCUE_TEAM: RadioTower, MEDICAL_TEAM: UserRound };

export default function RescueOperations() {
  const ops = useOpsData();
  const resources = ops.data?.resources || [];
  const available = resources.filter(r=>r.status==='AVAILABLE').length;
  const busy = resources.filter(r=>r.status==='BUSY' || r.status==='EN_ROUTE').length;
  return <div className="space-y-5">
    <PageHeader eyebrow={`National operations · ${ops.district} · ${ops.state}`} title="Rescue operations" action={<Badge tone="safe">{available} available</Badge>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Registered units" value={resources.length} icon={Truck}/><StatCard label="Available" value={available} icon={UserRound} tone="safe"/><StatCard label="Busy" value={busy} icon={RadioTower} tone="warn"/><StatCard label="Offline" value={resources.filter(r=>r.status==='OFFLINE').length} icon={RadioTower} tone="danger"/></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{resources.map(r=>{const Icon=icons[r.type]||Truck; return <Panel key={r._id} className="border-t-2 border-t-signal-blue"><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-signal-blue/10 p-2 text-signal-blue"><Icon size={17}/></div><div><p className="text-sm font-black">{r.name}</p><p className="text-[10px] uppercase tracking-wide text-slate-400">{r.type?.replaceAll('_',' ')}</p></div></div><Badge tone={r.status==='AVAILABLE'?'safe':r.status==='BUSY'||r.status==='EN_ROUTE'?'warn':'danger'}>{r.status==='EN_ROUTE'?'EN ROUTE':r.status}</Badge></div><p className="mt-3 text-xs text-slate-500">{r.capacity || 0} capacity · {Array.isArray(r.equipment)?r.equipment.join(', '):'Response equipment'}</p><div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{r.assignedIncident?'Mission assigned':'Standby'}</span>{r.contact?<a href={`tel:${r.contact}`} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-signal-blue"><PhoneCall size={12}/> Call unit</a>:null}</div></div></Panel>})}</div>
  </div>;
}
