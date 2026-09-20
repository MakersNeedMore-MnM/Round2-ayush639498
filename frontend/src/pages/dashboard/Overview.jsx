import React, { useMemo } from 'react';
import { AlertTriangle, MapPin, Warehouse, Route, Siren, CloudRain, ArrowRight, ShieldCheck, Navigation, Waves, Droplets, CloudDrizzle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOpsData, useAuth } from '../../context/AppProviders';
import { Panel, PanelHeader, StatCard, SeverityBadge, EmptyState, LoadingBar, Button, PageHeader, Badge } from '../../components/ui';
import { districtCenter } from '../../data/geo';
import { haversineKm, gmapsDirections } from '../../lib/api';

function ResidentOverview({ d, ops }) {
  const incidents=(d?.incidents||[]).filter(x=>!['RESOLVED','REJECTED'].includes(x.status));
  const alerts=d?.alerts||[];
  const shelters=d?.shelters||[];
  const evacuation=d?.evacuations||[];
  const critical=alerts.find(a=>['CRITICAL','HIGH'].includes(a.severity)) || incidents.find(i=>['CRITICAL','HIGH'].includes(i.severity));
  const nearest=useMemo(()=>{
    const c=districtCenter(ops.state,ops.district);
    return shelters.filter(s=>s.latitude&&s.longitude).map(s=>({...s,_distance:haversineKm(c.lat,c.lng,s.latitude,s.longitude)})).sort((a,b)=>(a._distance??999)-(b._distance??999))[0] || shelters[0];
  },[shelters,ops.state,ops.district]);
  const status=critical?.severity==='CRITICAL'?'CRITICAL':critical?.severity==='HIGH'?'HIGH':incidents.length?'WATCH':'SAFE';
  const statusCopy={CRITICAL:'Immediate attention required',HIGH:'Elevated flood situation',WATCH:'Flood activity reported nearby',SAFE:'No critical alert reported'}[status];
  const StatusIcon = status === 'CRITICAL' ? Waves : status === 'HIGH' ? Droplets : status === 'WATCH' ? CloudDrizzle : ShieldCheck;
  const statusIconClass = status === 'CRITICAL' ? 'bg-signal-red text-white' : status === 'HIGH' ? 'bg-signal-amber text-white' : status === 'WATCH' ? 'bg-signal-blue/10 text-signal-blue' : 'bg-signal-teal/10 text-signal-teal';

  return <div className="space-y-5">
    <PageHeader eyebrow={`${ops.district} · ${ops.state}`} title="Situation overview" subtitle="The information you need first, without the dashboard clutter."
      action={<Link to="/dashboard/sos"><Button variant="danger" className="hidden sm:inline-flex"><Siren size={15}/> Emergency SOS</Button></Link>}/>
    <section className={`border ${status==='CRITICAL'?'border-signal-red bg-signal-red/5':status==='HIGH'?'border-signal-amber bg-signal-amber/5':'border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900'}`}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
        <div className="flex items-start gap-4"><div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${statusIconClass}`}><StatusIcon size={20}/></div><div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[.13em] text-slate-500 dark:text-navy-300">Current flood status</span><Badge tone={status==='CRITICAL'?'danger':status==='HIGH'?'warn':'safe'}>{status}</Badge></div><h2 className="mt-1 text-xl font-black">{statusCopy}</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-navy-300">{critical?.title || `Monitoring ${ops.district} for active flood reports and official advisories.`}</p></div></div>
        <Link to="/dashboard/alerts"><Button variant="outline">View alerts <ArrowRight size={14}/></Button></Link>
      </div>
    </section>

    <div className="grid gap-4 md:grid-cols-3">
      <Panel><PanelHeader title="Your area" eyebrow="LOCATION"/><div className="px-5 py-5"><div className="flex items-center gap-2 text-sm font-extrabold"><MapPin size={16} className="text-signal-blue"/>{ops.district}</div><p className="mt-1 text-xs text-slate-500 dark:text-navy-400">{ops.state}</p><Link to="/dashboard/map" className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide">Open affected areas <ArrowRight size={12}/></Link></div></Panel>
      <Panel><PanelHeader title="Nearest shelter" eyebrow="SAFETY"/><div className="px-5 py-5">{nearest?<><p className="text-sm font-extrabold">{nearest.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-navy-400">{nearest.occupancy||0} / {nearest.capacity||0} occupied · {nearest.status||'STATUS UNKNOWN'}</p><Link to="/dashboard/shelters" className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide">View shelters <ArrowRight size={12}/></Link></>:<p className="text-xs text-slate-500">Shelter data unavailable.</p>}</div></Panel>
      <Panel><PanelHeader title="Evacuation" eyebrow="MOVEMENT"/><div className="px-5 py-5">{evacuation.length?<><p className="text-sm font-extrabold">{evacuation[0].status||'Active guidance'}</p><p className="mt-1 text-xs text-slate-500 dark:text-navy-400">{evacuation[0].message || evacuation[0].instructions || 'Follow the latest district evacuation guidance.'}</p></>:<><p className="text-sm font-extrabold">No active order shown</p><p className="mt-1 text-xs text-slate-500 dark:text-navy-400">Check current guidance before moving.</p></>}<Link to="/dashboard/evacuation" className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide">Open evacuation <ArrowRight size={12}/></Link></div></Panel>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.5fr_.5fr]">
      <Panel><PanelHeader title="Nearby reports" subtitle="Situations reported in this district" action={<Link to="/dashboard/incidents" className="text-[10px] font-black uppercase tracking-wide">All reports <ArrowRight size={12} className="inline"/></Link>}/>
        {incidents.length?<ul className="divide-y divide-slate-100 dark:divide-navy-800">{incidents.slice(0,5).map(i=><li key={i._id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-bold">{(i.type||'Flood incident').replaceAll('_',' ')}</p><p className="truncate text-xs text-slate-500 dark:text-navy-400">{i.location||i.zone||'Location not specified'}</p></div><SeverityBadge level={i.severity}/></li>)}</ul>:<EmptyState icon={ShieldCheck} title="No active reports" subtitle="No unresolved incidents are currently shown for this district."/>}
      </Panel>
      <Panel><PanelHeader title="Weather" eyebrow="CONTEXT"/><div className="px-5 py-5">{d?.weather?<><div className="flex items-center gap-2"><CloudRain size={18}/><span className="text-2xl font-black">{d.weather.temperature}°C</span></div><p className="mt-2 text-xs text-slate-500 dark:text-navy-400">Rain {d.weather.rainfallMm} mm · Wind {d.weather.windSpeed} km/h</p></>:<p className="text-xs text-slate-500">Weather reading unavailable.</p>}</div></Panel>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:border-navy-800"><span>Data refreshes automatically when connected</span><Link to="/dashboard/sos" className="text-signal-red sm:hidden">Open emergency SOS</Link></div>
  </div>;
}

function AdminOverview({ d, ops }) {
  const incidents=d?.incidents||[], resources=d?.resources||[], shelters=d?.shelters||[], roads=d?.roads||[];
  const active=incidents.filter(i=>!['RESOLVED','REJECTED'].includes(i.status));
  const critical=active.filter(i=>i.severity==='CRITICAL').length;
  const available=resources.filter(r=>r.status==='AVAILABLE').length;
  const capacity=shelters.reduce((a,x)=>a+(x.capacity||0),0), occupancy=shelters.reduce((a,x)=>a+(x.occupancy||0),0);
  const blocked=roads.filter(r=>r.status!=='OPEN').length;
  return <div className="space-y-5">
    <PageHeader eyebrow={`${ops.district} · ${ops.state}`} title="District command" subtitle="Current operating picture and response priorities." action={<Link to="/dashboard/map"><Button variant="outline"><Navigation size={14}/> Live map</Button></Link>}/>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><StatCard label="Active incidents" value={active.length} icon={AlertTriangle} tone={active.length?'warn':'safe'}/><StatCard label="Critical" value={critical} icon={Siren} tone={critical?'danger':'safe'}/><StatCard label="Available units" value={available} icon={Route}/><StatCard label="Shelter occupancy" value={capacity?Math.round(occupancy/capacity*100):0} suffix="%" icon={Warehouse}/><StatCard label="Roads affected" value={blocked} icon={Route}/></div>
    <div className="grid gap-4 lg:grid-cols-[1.45fr_.55fr]">
      <Panel><PanelHeader title="Priority incidents" subtitle="Newest unresolved incidents" action={<Link to="/dashboard/incidents" className="text-[10px] font-black uppercase tracking-wide">Open queue <ArrowRight size={12} className="inline"/></Link>}/>{active.length?<ul className="divide-y divide-slate-100 dark:divide-navy-800">{active.slice(0,7).map(i=><li key={i._id} className="flex items-center justify-between gap-4 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-bold">{i.code} · {(i.type||'Incident').replaceAll('_',' ')}</p><p className="truncate text-xs text-slate-500">{i.location||i.zone||'No location'}</p></div><SeverityBadge level={i.severity}/></li>)}</ul>:<EmptyState icon={ShieldCheck} title="No active incidents" subtitle="The current district feed has no unresolved incidents."/>}</Panel>
      <Panel><PanelHeader title="Weather" subtitle={d?.weather?.condition||'No current reading'}/><div className="px-5 py-5">{d?.weather?<><p className="text-3xl font-black">{d.weather.temperature}°C</p><p className="mt-2 text-xs text-slate-500">Rain {d.weather.rainfallMm} mm · Humidity {d.weather.humidity}%</p><div className="mt-4 border-t border-slate-200 pt-4 text-xs dark:border-navy-800">Warning level <b>{d.weather.warningLevel||'—'}</b></div></>:<p className="text-xs text-slate-500">Weather unavailable.</p>}</div></Panel>
    </div>
    <Panel><PanelHeader title="Official alerts" action={<Link to="/dashboard/alerts" className="text-[10px] font-black uppercase tracking-wide">View all <ArrowRight size={12} className="inline"/></Link>}/>{(d?.alerts||[]).slice(0,4).map(a=><div key={a._id} className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3.5 last:border-0 dark:border-navy-800"><div><p className="text-sm font-bold">{a.title}</p><p className="mt-1 text-xs text-slate-500">{a.description}</p></div><SeverityBadge level={a.severity}/></div>)}</Panel>
  </div>;
}

export default function Overview(){
  const ops=useOpsData(), auth=useAuth(), d=ops.data;
  return <><LoadingBar active={ops.loading&&!d}/>{auth.isAdmin?<AdminOverview d={d} ops={ops}/>:<ResidentOverview d={d} ops={ops}/>}</>;
}
