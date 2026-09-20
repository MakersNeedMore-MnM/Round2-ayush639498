import React, { useState } from 'react';
import { Siren, MapPin, Loader2, CheckCircle2, PhoneCall, Radio, Navigation, ShieldAlert } from 'lucide-react';
import { useAuth, useOpsData } from '../../context/AppProviders';
import { api, gmapsDirections } from '../../lib/api';
import { Panel, PanelHeader, Button, EmptyState, Badge } from '../../components/ui';

const REPORT_TYPES = ['FLOOD', 'WATER_RESCUE', 'MEDICAL', 'TRAPPED', 'STRUCTURE_DAMAGE', 'OTHER'];

function ResidentSOS() {
  const ops = useOpsData();
  const [type, setType] = useState('FLOOD');
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function locate() {
    if (!navigator.geolocation) { setError('Location is not available on this device'); return; }
    setError(''); setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setError('Could not read your location. Enable location access and try again.'); setLocating(false); },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );
  }

  async function sendReport(payload) {
    const res = await api('/citizen-reports', { method: 'post', data: payload });
    return res.data.data || res.data;
  }

  async function quickSOS() {
    setError(''); setQuickSubmitting(true);
    try {
      if (!navigator.geolocation) throw new Error('Location is not available on this device');
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }));
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(point);
      const data = await sendReport({ type: 'TRAPPED', description: 'I am in danger and need immediate help.', rawText: 'I am in danger and need immediate help.', peopleAffected: 1, latitude: point.lat, longitude: point.lng, state: ops.state, district: ops.district, immediate: true });
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Location is required for the nearby emergency alert. Enable location access and try again, or call 112.');
    } finally { setQuickSubmitting(false); }
  }

  async function submit() {
    setError(''); setSubmitting(true);
    try {
      const data = await sendReport({ type, description, rawText: description, peopleAffected: Number(peopleAffected) || 1, latitude: coords?.lat, longitude: coords?.lng, state: ops.state, district: ops.district });
      setResult(data); setDescription('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not submit your report, please try again or call 112');
    } finally { setSubmitting(false); }
  }

  if (result) return <Panel><div className="flex flex-col items-center gap-3 px-6 py-14 text-center"><CheckCircle2 size={38} className="text-signal-teal" /><Badge tone="safe">Emergency sent</Badge><h2 className="text-xl font-black text-navy-900 dark:text-white">Help request received</h2><p className="max-w-md text-sm leading-6 text-slate-500 dark:text-navy-300">District command has received your report. Nearby Rashak users with location sharing enabled are alerted for immediate local awareness.</p><div className="flex flex-wrap justify-center gap-2"><a href="tel:112" className="inline-flex h-10 items-center gap-2 rounded-full bg-signal-red px-4 text-xs font-extrabold text-white"><PhoneCall size={14} /> Call 112</a><Button variant="outline" onClick={() => setResult(null)}>Submit another report</Button></div></div></Panel>;

  return (
    <div className="space-y-5">
      <Panel className="border-signal-red/20 bg-gradient-to-br from-white to-signal-red/[.04] dark:from-navy-900 dark:to-signal-red/[.06]">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-red text-white"><ShieldAlert size={19} /></span><Badge tone="danger">Immediate help</Badge></div><h2 className="mt-4 text-2xl font-black tracking-tight">I am in danger</h2><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-navy-300">Send your current location to Rashak. People nearby who are actively using the app can receive an emergency alert.</p><div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><Radio size={12} className="text-signal-teal" /> Nearby alert radius: 5 km · live location required</div></div>
          <button onClick={quickSOS} disabled={quickSubmitting} className="group flex min-h-24 min-w-[210px] items-center justify-center gap-3 rounded-2xl bg-navy-950 px-7 py-6 text-sm font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100 disabled:opacity-60"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal-red/10 text-signal-red dark:bg-signal-red/10">{quickSubmitting ? <Loader2 size={22} className="animate-spin" /> : <Siren size={22} />}</span>{quickSubmitting ? 'Sending' : 'I am in danger'}</button>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2"><PanelHeader title="Report another emergency" subtitle="Add details for district response" /><div className="space-y-4 px-5 py-5">
          <div><label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-navy-400">Type of emergency</label><div className="mt-2 flex flex-wrap gap-2">{REPORT_TYPES.map(item => <button key={item} onClick={() => setType(item)} className={'rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ' + (type === item ? 'border-signal-red bg-signal-red text-white' : 'border-slate-300 text-navy-700 dark:border-navy-700 dark:text-navy-200')}>{item.replaceAll('_', ' ')}</button>)}</div></div>
          <div><label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-navy-400">What is happening</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={800} placeholder="Describe the situation and a nearby landmark" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-navy-400">People affected</label><input type="number" min={1} max={500} value={peopleAffected} onChange={e => setPeopleAffected(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white" /></div><div><label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-navy-400">Location</label><button onClick={locate} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-900 dark:border-navy-700 dark:text-white">{locating ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}{coords ? 'Location captured' : 'Use current location'}</button></div></div>
          {error && <p className="rounded-xl bg-signal-red/5 px-3 py-2.5 text-sm font-semibold text-signal-red">{error}</p>}
          <Button variant="danger" onClick={submit} disabled={submitting} className="w-full rounded-xl">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Siren size={16} />} Submit SOS report</Button>
        </div></Panel>
        <Panel><PanelHeader title="Emergency contacts" subtitle="Use 112 for life threatening emergencies" /><div className="space-y-3 px-5 py-5"><a href="tel:112" className="flex items-center justify-between rounded-xl border border-signal-red bg-signal-red/5 px-4 py-3 text-sm font-bold text-signal-red">National Emergency <span className="flex items-center gap-1"><PhoneCall size={15} /> 112</span></a>{(ops.data?.emergencyContacts || []).slice(0, 5).map(c => <a key={c._id || c.phone} href={'tel:' + c.phone} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-navy-800 dark:border-navy-800 dark:text-navy-100">{c.name} <span className="flex items-center gap-1"><PhoneCall size={14} /> {c.phone}</span></a>)}</div></Panel>
      </div>
    </div>
  );
}

function AdminSOSQueue() {
  const ops = useOpsData();
  const reports = ops.data?.reports || [];
  return <Panel><PanelHeader title="Incoming SOS queue" subtitle={reports.length + ' resident reports'} />{reports.length === 0 ? <EmptyState icon={Siren} title="No pending SOS reports" subtitle="Resident submitted emergencies will appear here in real time." /> : <ul className="divide-y divide-slate-100 dark:divide-navy-800">{reports.map(r => <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-bold text-navy-900 dark:text-white">{(r.type || 'REPORT').replaceAll('_', ' ')}</p><Badge tone={r.status === 'PENDING' ? 'warn' : 'safe'}>{r.status || 'PENDING'}</Badge></div><p className="mt-1 max-w-lg truncate text-sm text-slate-500 dark:text-navy-300">{r.description || r.rawText}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{r.peopleAffected || 1} people affected</p></div>{r.latitude && r.longitude ? <a href={gmapsDirections(r.latitude, r.longitude)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy-800 dark:border-navy-700 dark:text-white"><MapPin size={13} /> Directions</a> : null}</li>)}</ul>}</Panel>;
}

export default function SOS() {
  const auth = useAuth();
  return <div className="space-y-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">{auth.isAdmin ? 'District operations' : 'Emergency support'}</p><h1 className="mt-1 text-2xl font-black tracking-tight text-navy-950 dark:text-white">SOS</h1><p className="mt-1 text-sm text-slate-500 dark:text-navy-300">{auth.isAdmin ? 'Live resident emergency reports for this district' : 'Fast local help when you need it'}</p></div>{auth.isAdmin ? <AdminSOSQueue /> : <ResidentSOS />}</div>;
}
