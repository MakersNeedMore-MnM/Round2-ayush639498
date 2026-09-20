import React from 'react';
import { PhoneCall, ShieldCheck, Ambulance, Flame } from 'lucide-react';
import { useOpsData } from '../../context/AppProviders';
import { Panel, PageHeader, Badge } from '../../components/ui';

const iconFor = category => category?.toLowerCase().includes('ambulance') ? Ambulance : category?.toLowerCase().includes('fire') ? Flame : ShieldCheck;
export default function EmergencyContacts(){const ops=useOpsData();const contacts=ops.data?.emergencyContacts||[];return <div className="space-y-5"><PageHeader eyebrow={`${ops.district} · ${ops.state}`} title="Emergency contacts" action={<Badge tone="safe">Call ready</Badge>}/><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{contacts.map((c,i)=>{const Icon=iconFor(c.category);return <Panel key={`${c.phone}-${i}`} className="border-t-2 border-t-signal-blue"><div className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-signal-blue/10 p-2 text-signal-blue"><Icon size={17}/></div><div><p className="text-sm font-black">{c.name}</p><p className="mt-1 text-xs text-slate-500">{c.category}</p></div></div><a href={`tel:${c.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-navy-950 px-3 py-2 text-xs font-black text-white dark:bg-white dark:text-navy-950"><PhoneCall size={14}/> Call {c.phone}</a></div></Panel>})}</div></div>}
