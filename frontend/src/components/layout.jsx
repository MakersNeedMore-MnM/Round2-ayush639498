import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Siren, Warehouse, Route, Radio, ListChecks,
  Bell, Settings, LogOut, Sun, Moon, Menu, X, ShieldCheck, ChevronDown,
  MapPinned, AlertTriangle, Truck, Navigation2, Construction, PhoneCall
} from 'lucide-react';
import { useAuth, useTheme, useOpsData } from '../context/AppProviders';
import { STATES } from '../data/geo';

const RESIDENT = [
  { to:'/dashboard', label:'Overview', icon:LayoutDashboard, end:true },
  { to:'/dashboard/map', label:'Affected Areas', icon:Map },
  { to:'/dashboard/alerts', label:'Flood Alerts', icon:AlertTriangle },
  { to:'/dashboard/evacuation', label:'Evacuation', icon:Route },
  { to:'/dashboard/shelters', label:'Shelters', icon:Warehouse },
  { to:'/dashboard/incidents', label:'Report Incident', icon:ListChecks },
  { to:'/dashboard/sos', label:'Emergency SOS', icon:Siren, danger:true },
  { to:'/dashboard/emergency-contacts', label:'Emergency Contacts', icon:PhoneCall },
  { to:'/dashboard/notifications', label:'Notifications', icon:Bell },
  { to:'/dashboard/mesh', label:'Local Mesh', icon:Radio },
  { to:'/dashboard/settings', label:'Settings', icon:Settings }
];

const ADMIN = [
  { to:'/dashboard', label:'Command Overview', icon:LayoutDashboard, end:true },
  { to:'/dashboard/map', label:'Live Response Map', icon:Map },
  { to:'/dashboard/incidents', label:'Incident Queue', icon:ListChecks },
  { to:'/dashboard/alerts', label:'Official Alerts', icon:AlertTriangle },
  { to:'/dashboard/shelters', label:'Shelter Network', icon:Warehouse },
  { to:'/dashboard/evacuation', label:'Evacuation Operations', icon:Route },
  { to:'/dashboard/rescue-operations', label:'Rescue Operations', icon:Truck },
  { to:'/dashboard/rescue-tracking', label:'Rescue Tracking', icon:Navigation2 },
  { to:'/dashboard/road-network', label:'Road Network', icon:Construction },
  { to:'/dashboard/emergency-contacts', label:'Emergency Contacts', icon:PhoneCall },
  { to:'/dashboard/mesh', label:'Local Mesh', icon:Radio },
  { to:'/dashboard/notifications', label:'Notifications', icon:Bell },
  { to:'/dashboard/settings', label:'Settings', icon:Settings }
];

function Brand({ compact=false }) {
  return <div className="flex items-center gap-2.5">
    <img src="/rashak-logo.png" alt="Rashak" className="h-10 w-10 shrink-0 object-contain" />
    {!compact && <div className="min-w-0"><p className="text-sm font-black tracking-[.18em] text-navy-950 dark:text-white">RASHAK</p><p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-400 dark:text-navy-500">Flood Response Network</p></div>}
  </div>;
}

export function Sidebar({ open, onClose }) {
  const auth = useAuth();
  const items = auth.isAdmin ? ADMIN : RESIDENT;
  return <aside className={`fixed inset-y-0 left-0 z-[1000] flex w-[268px] flex-col border-r border-slate-200 bg-white transition-transform dark:border-navy-800 dark:bg-navy-950 lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
    <div className="flex h-[68px] items-center justify-between border-b border-slate-200 px-5 dark:border-navy-800">
      <Brand/><button className="p-1 text-slate-400 lg:hidden" onClick={onClose}><X size={19}/></button>
    </div>
    <div className="border-b border-slate-200 px-5 py-4 dark:border-navy-800">
      <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">Workspace</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div><p className="text-sm font-extrabold text-navy-950 dark:text-white">{auth.isAdmin?'District Command':'Resident Services'}</p><p className="text-[11px] text-slate-500 dark:text-navy-400">{auth.user?.name || 'Active session'}</p></div>
        <span className={`h-2 w-2 rounded-full ${auth.isAdmin?'bg-signal-blue':'bg-signal-teal'}`}/>
      </div>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <p className="px-3 pb-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">Navigation</p>
      {items.map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
        className={({isActive}) => `mb-1 flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition ${isActive?'bg-navy-950 text-white dark:bg-white dark:text-navy-950':'text-navy-700 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-900'} ${item.danger && !isActive?'text-signal-red hover:bg-signal-red/5':''}`}>
        <item.icon size={16}/><span className="flex-1">{item.label}</span>{item.danger && <span className="h-1.5 w-1.5 rounded-full bg-signal-red"/>}
      </NavLink>)}
    </nav>
    <div className="border-t border-slate-200 p-4 dark:border-navy-800">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-signal-teal"><span className="h-1.5 w-1.5 rounded-full bg-signal-teal"/> Response network active</div>
    </div>
  </aside>;
}

export function Topbar({ onMenu }) {
  const theme = useTheme(), auth = useAuth(), ops = useOpsData(), navigate = useNavigate(), location = useLocation();
  const title = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
  async function logout(){ await auth.logout(); navigate('/'); }
  return <header className="sticky top-0 z-40 flex min-h-[68px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-navy-800 dark:bg-navy-950/95 lg:px-7">
    <div className="flex min-w-0 items-center gap-3">
      <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-navy-900" onClick={onMenu}><Menu size={19}/></button>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-extrabold uppercase tracking-[.1em] text-navy-900 dark:text-white">{title==='dashboard' ? (auth.isAdmin?'District Command':'Resident Services') : title.replaceAll('-',' ')}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
          <MapPinned size={11}/>{ops.district}, {ops.state}
          <span className="hidden h-3 w-px bg-slate-300 sm:block dark:bg-navy-700"/>
          <span className={ops.connected?'text-signal-teal':'text-signal-amber'}>{ops.connected?'Live connection':'Using last known data'}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <div className="hidden items-center gap-1.5 pr-2 sm:flex">
        <select aria-label="State" value={ops.state} onChange={e=>ops.setState(e.target.value)} className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[11px] font-bold text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white">
          {Object.keys(STATES).map(s=><option key={s}>{s}</option>)}
        </select>
        <select aria-label="District" value={ops.district} onChange={e=>ops.setDistrict(e.target.value)} className="h-9 max-w-44 rounded-sm border border-slate-300 bg-white px-2 text-[11px] font-bold text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-white">
          {(STATES[ops.state]||[]).map(d=><option key={d}>{d}</option>)}
        </select>
      </div>
      <NavLink aria-label="Notifications" to="/dashboard/notifications" className="relative rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-navy-900">
        <Bell size={17}/>{ops.notifications.length>0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal-red"/>}
      </NavLink>
      <button aria-label="Toggle theme" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-navy-900" onClick={theme.toggleTheme}>{theme.theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>
      <button onClick={logout} className="ml-1 hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide hover:bg-slate-50 dark:border-navy-700 dark:hover:bg-navy-900 sm:flex"><LogOut size={13}/> Sign out</button>
    </div>
  </header>;
}

function NearbyAlertBanner() {
  const ops = useOpsData();
  const [dismissedId, setDismissedId] = useState(null);
  const latest = ops.notifications.find(n => n.type === 'SOS_NEARBY');
  useEffect(function autoDismiss() {
    if (!latest) return;
    const timer = setTimeout(() => setDismissedId(latest.id), 20000);
    return () => clearTimeout(timer);
  }, [latest?.id]);
  if (!latest || latest.id === dismissedId) return null;
  return <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between gap-3 bg-signal-red px-4 py-3 text-white shadow-lg sm:left-[268px]">
    <div className="flex min-w-0 items-center gap-2.5"><Siren size={16} className="shrink-0"/><p className="truncate text-xs font-bold">{latest.message}</p></div>
    <button aria-label="Dismiss" onClick={()=>setDismissedId(latest.id)} className="shrink-0 rounded-full p-1 hover:bg-white/15"><X size={15}/></button>
  </div>;
}

export function DashboardLayout() {
  const [open,setOpen]=useState(false);
  return <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
    <NearbyAlertBanner/>
    <Sidebar open={open} onClose={()=>setOpen(false)}/>
    {open && <div className="fixed inset-0 z-[900] bg-navy-950/60 lg:hidden" onClick={()=>setOpen(false)}/>}
    <div className="min-w-0 lg:pl-[268px]">
      <Topbar onMenu={()=>setOpen(true)}/>
      <main className="mx-auto min-w-0 max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7"><Outlet/></main>
    </div>
    {!useAuth().isAdmin && <NavLink to="/dashboard/sos" className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-navy-950 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg sm:hidden dark:bg-white dark:text-navy-950"><Siren size={16}/> SOS</NavLink>}
  </div>;
}
