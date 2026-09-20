import React, { useState } from 'react';
import { Route, CircleAlert, CheckCircle2, Save } from 'lucide-react';
import { useOpsData } from '../../context/AppProviders';
import { api } from '../../lib/api';
import { Panel, PageHeader, Badge, Button, StatCard } from '../../components/ui';

export default function RoadNetwork() {
  const ops = useOpsData();
  const roads = ops.data?.roads || [];
  const [saving,setSaving]=useState('');
  async function update(road,status){setSaving(road._id);try{await api(`/roads/${road._id}`,{method:'patch',data:{status}});ops.refresh();}finally{setSaving('');}}
  return <div className="space-y-5"><PageHeader eyebrow={`National operations · ${ops.district} · ${ops.state}`} title="Road network" action={<Badge tone="info">{roads.length} monitored</Badge>}/><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Open" value={roads.filter(r=>r.status==='OPEN').length} icon={CheckCircle2} tone="safe"/><StatCard label="Blocked" value={roads.filter(r=>r.status==='BLOCKED').length} icon={CircleAlert} tone="danger"/><StatCard label="Flooded" value={roads.filter(r=>r.status==='FLOODED').length} icon={Route} tone="warn"/><StatCard label="Needs review" value={roads.filter(r=>r.status!=='OPEN').length} icon={CircleAlert} tone="warn"/></div><div className="space-y-3">{roads.map(r=><Panel key={r._id} className="border-t-2 border-t-signal-blue"><div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black">{r.name}</p><p className="mt-1 text-xs text-slate-500">{r.note || 'Road condition monitoring'}</p></div><div className="flex items-center gap-2"><Badge tone={r.status==='OPEN'?'safe':r.status==='BLOCKED'?'danger':'warn'}>{r.status}</Badge><select disabled={saving===r._id} value={r.status} onChange={e=>update(r,e.target.value)} className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-xs font-bold dark:border-navy-700 dark:bg-navy-950"><option>OPEN</option><option>BLOCKED</option><option>FLOODED</option></select></div></div></Panel>)}</div></div>;
}
