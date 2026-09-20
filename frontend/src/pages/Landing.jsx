import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import {
  ArrowRight, ShieldCheck, Siren, X, Loader2, Sun, Moon, Radio, Route, Warehouse,
  AlertTriangle, Menu, Globe2, ChevronDown, MapPinned, Database, Wifi, Users2,
  CheckCircle2, BellRing
} from 'lucide-react';
import { useAuth, useTheme } from '../context/AppProviders';
import { STATE_DISTRICTS, DEFAULT_STATE, DEFAULT_DISTRICT } from '../data/geo';
import { api } from '../lib/api';
import { LANGUAGES } from '../i18n';
import { Badge, MapAutoSize } from '../components/ui';

const TONE_COLOR = { CRITICAL: '#b3261e', HIGH: '#c77b00', WATCH: '#325780', SAFE: '#0f6d5c' };

function tone(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const r = h % 10;
  return name === 'Assam' ? 'CRITICAL' : r < 2 ? 'CRITICAL' : r < 4 ? 'HIGH' : r < 7 ? 'WATCH' : 'SAFE';
}
function centroid(entry) {
  const p = Object.values(entry.districts);
  return { lat: p.reduce((a, x) => a + x.lat, 0) / p.length, lng: p.reduce((a, x) => a + x.lng, 0) / p.length };
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const auth = useAuth(), theme = useTheme(), navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('/dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [liveData, setLiveData] = useState(null);

  const markers = useMemo(() => Object.entries(STATE_DISTRICTS).map(([name, entry]) => ({ name, ...centroid(entry), tone: tone(name) })), []);
  const summary = useMemo(() => markers.reduce((acc, marker) => ({ ...acc, [marker.tone]: acc[marker.tone] + 1 }), { CRITICAL: 0, HIGH: 0, WATCH: 0, SAFE: 0 }), [markers]);

  useEffect(() => {
    if (!auth.user) { setLiveData(null); return undefined; }
    let alive = true;
    api('/dashboard', { params: { state: auth.user.state || DEFAULT_STATE, district: auth.user.district || DEFAULT_DISTRICT } })
      .then(res => alive && setLiveData(res.data.data))
      .catch(() => alive && setLiveData(null));
    return () => { alive = false; };
  }, [auth.user]);

  function enter(target = '/dashboard') {
    setMenuOpen(false);
    if (auth.user) { navigate(target); return; }
    setRedirectTarget(target); setError(''); setGateOpen(true);
  }

  async function choose(role) {
    setSubmitting(true); setError('');
    try { await auth.selectRole(role, undefined, i18n.language); navigate(redirectTarget); }
    catch (e) { setError(e?.response?.data?.message || t('landing.gate.error')); }
    finally { setSubmitting(false); }
  }

  function pickLanguage(code) {
    i18n.changeLanguage(code); setLangOpen(false); setMenuOpen(false);
  }

  const currentLang = LANGUAGES.find(l => l[0] === i18n.language) || LANGUAGES[0];
  const stats = [
    [BellRing, t('landing.cards.alerts'), liveData?.alerts?.length],
    [MapPinned, t('landing.cards.areas'), liveData ? new Set((liveData.incidents || []).map(x => x.zone || x.district)).size : null],
    [Warehouse, t('landing.cards.shelters'), liveData ? (liveData.shelters || []).filter(x => ['OPEN', 'NEAR_CAPACITY'].includes(x.status)).length : null],
    [Siren, t('landing.cards.incidents'), liveData?.incidents?.length]
  ];
  const features = [
    [AlertTriangle, t('landing.features.alertsTitle'), t('landing.features.alertsDesc')],
    [Siren, t('landing.features.sosTitle'), t('landing.features.sosDesc')],
    [Warehouse, t('landing.features.sheltersTitle'), t('landing.features.sheltersDesc')],
    [Route, t('landing.features.evacuationTitle'), t('landing.features.evacuationDesc')],
    [Radio, t('landing.features.meshTitle'), t('landing.features.meshDesc')],
    [Users2, t('landing.trust.accessibleTitle'), t('landing.trust.accessibleDesc')]
  ];
  const about = [
    [CheckCircle2, t('landing.trust.officialTitle'), t('landing.trust.officialDesc')],
    [Database, t('landing.resilient.cacheTitle'), t('landing.resilient.cacheDesc')],
    [Wifi, t('landing.resilient.fallbackTitle'), t('landing.resilient.fallbackDesc')]
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-navy-950 dark:bg-navy-950 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/90">
        <div className="flex h-[68px] w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
            <img src="/rashak-logo.png" alt="Rashak" className="h-10 w-10 object-contain" />
            <span className="text-sm font-black tracking-[.16em]">RASHAK</span>
          </button>

          <nav className="hidden items-center gap-7 text-xs font-bold text-slate-600 lg:flex dark:text-navy-200">
            <a href="#map" className="transition hover:text-navy-950 dark:hover:text-white">{t('landing.nav.map')}</a>
            <a href="#features" className="transition hover:text-navy-950 dark:hover:text-white">{t('landing.nav.features')}</a>
            <a href="#about" className="transition hover:text-navy-950 dark:hover:text-white">{t('landing.nav.about')}</a>
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="relative hidden sm:block">
              <button onClick={() => setLangOpen(!langOpen)} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-900">
                <Globe2 size={14} /> {currentLang[0].toUpperCase()} <ChevronDown size={12} />
              </button>
              {langOpen && <div className="absolute right-0 top-11 z-50 grid w-64 grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900">
                {LANGUAGES.map(([code, label]) => <button key={code} onClick={() => pickLanguage(code)} className={'rounded-xl px-2.5 py-2 text-left text-xs font-semibold ' + (i18n.language === code ? 'bg-navy-950 text-white dark:bg-white dark:text-navy-950' : 'text-navy-700 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-800')}>{label}</button>)}
              </div>}
            </div>
            <button aria-label="Toggle theme" className="hidden h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100 sm:block dark:text-navy-200 dark:hover:bg-navy-900" onClick={theme.toggleTheme}>{theme.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button onClick={() => enter('/dashboard')} className="hidden h-10 items-center rounded-full bg-navy-950 px-4 text-xs font-extrabold text-white shadow-sm hover:bg-navy-800 sm:inline-flex dark:bg-white dark:text-navy-950">{t('landing.nav.enter')}</button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 lg:hidden dark:hover:bg-navy-900"><Menu size={18} /></button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden dark:border-navy-800 dark:bg-navy-950">
          <div className="mx-auto grid max-w-[1280px] gap-2">
            {[["#map", t('landing.nav.map')], ["#features", t('landing.nav.features')], ["#about", t('landing.nav.about')]].map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-navy-900">{label}</a>)}
            <button onClick={() => enter('/dashboard')} className="mt-1 h-11 rounded-xl bg-navy-950 text-xs font-extrabold text-white dark:bg-white dark:text-navy-950">{t('landing.nav.enter')}</button>
          </div>
        </div>}
      </header>

      <main>
        <section className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-14 lg:pt-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-signal-blue/15 bg-signal-blue/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-signal-blue dark:bg-signal-blue/10 dark:text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-signal-teal" /> {t('landing.hero.badge')}</div>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-5xl lg:text-[62px]">{t('landing.hero.line1')}<br />{t('landing.hero.line2')}<br /><span className="text-signal-blue">{t('landing.hero.line3')}</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-slate-500 dark:text-navy-300">{t('landing.hero.sub')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => enter('/dashboard')} className="inline-flex h-12 items-center gap-2 rounded-full bg-navy-950 px-5 text-xs font-extrabold text-white shadow-sm hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100">{t('landing.nav.enter')} <ArrowRight size={14} /></button>
              <button onClick={() => enter('/dashboard/sos')} className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-xs font-extrabold text-navy-900 hover:bg-slate-100 dark:border-navy-700 dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"><Siren size={15} /> {t('landing.hero.cta1')}</button>
            </div>
            <p className="mt-4 text-[10px] font-semibold text-slate-400 dark:text-navy-500">{t('landing.hero.footnote')}</p>
          </div>

          <div id="map" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(8,26,47,.09)] dark:border-navy-800 dark:bg-navy-900 dark:shadow-none">
            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-navy-900 shadow-sm backdrop-blur dark:border-navy-700 dark:bg-navy-950/90 dark:text-white">India · live view</div>
            <div className="h-[360px] sm:h-[430px]">
              <MapContainer center={[22.5, 79]} zoom={4.6} scrollWheelZoom={false} className="h-full w-full">
                <MapAutoSize />
                <TileLayer url={theme.theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
                {markers.map(m => <CircleMarker key={m.name} center={[m.lat, m.lng]} radius={m.name === 'Assam' ? 7 : 5} pathOptions={{ color: TONE_COLOR[m.tone], fillColor: TONE_COLOR[m.tone], fillOpacity: .88, weight: 1.5 }}><Tooltip direction="top">{m.name} · {m.tone}</Tooltip></CircleMarker>)}
              </MapContainer>
            </div>
            <div className="grid grid-cols-4 divide-x divide-slate-200 border-t border-slate-200 bg-white dark:divide-navy-800 dark:border-navy-800 dark:bg-navy-900">
              {['CRITICAL', 'HIGH', 'WATCH', 'SAFE'].map(key => <div key={key} className="px-3 py-3"><p className="text-lg font-black">{summary[key]}</p><p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">{t('landing.map.legend' + key.charAt(0) + key.slice(1).toLowerCase())}</p></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(([Icon, label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <div className="flex items-center justify-between"><Icon size={16} className="text-signal-blue" /><Badge tone="info">{value == null ? 'SIGN IN' : 'LIVE'}</Badge></div>
              <p className="mt-4 text-2xl font-black">{value == null ? '—' : value}</p><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">{label}</p>
            </div>)}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-signal-blue">Rashak</p><h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{t('landing.features.heading')}</h2></div><p className="max-w-md text-xs leading-5 text-slate-500 dark:text-navy-300">{t('landing.features.sub')}</p></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([Icon, title]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-navy-800 dark:bg-navy-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950 text-white dark:bg-white dark:text-navy-950"><Icon size={17} /></div><h3 className="mt-4 text-sm font-extrabold">{title}</h3>
            </div>)}
          </div>
        </section>

        <section id="about" className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="rounded-3xl bg-navy-950 p-6 text-white sm:p-8 lg:p-10">
            <div className="max-w-xl"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-blue-200">About Rashak</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{t('landing.trust.heading')}</h2><p className="mt-2 text-xs leading-5 text-navy-200">{t('landing.trust.sub')}</p></div>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {about.map(([Icon, title]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><Icon size={17} className="text-blue-200" /><h3 className="mt-3 text-sm font-extrabold">{title}</h3></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-navy-800 dark:bg-navy-900">
            <div><p className="text-sm font-extrabold">{t('landing.final.line1')} {t('landing.final.line2')}</p><p className="mt-1 text-xs text-slate-500 dark:text-navy-400">{t('landing.footer.note')}</p></div>
            <button onClick={() => enter('/dashboard')} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy-950 px-5 text-xs font-extrabold text-white hover:bg-navy-800 dark:bg-white dark:text-navy-950">{t('landing.final.cta1')} <ArrowRight size={14} /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-navy-800"><div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-6 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400 sm:px-6 lg:px-8"><span>{t('landing.footer.tag')}</span><span>112 · {currentLang[1]}</span></div></footer>

      {gateOpen && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-navy-950/70 px-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-navy-700 dark:bg-navy-900">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 dark:border-navy-800"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-signal-blue">{t('landing.gate.eyebrow')}</p><h2 className="mt-1 text-lg font-black">{t('landing.gate.title')}</h2><p className="mt-1 text-xs text-slate-500 dark:text-navy-300">{t('landing.gate.sub')}</p></div><button aria-label="Close" onClick={() => setGateOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"><X size={17} /></button></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {[['RESIDENT', t('landing.gate.residentTitle'), t('landing.gate.residentDesc'), Users2], ['ADMIN', t('landing.gate.adminTitle'), t('landing.gate.adminDesc'), ShieldCheck]].map(([role, title, desc, Icon]) => <button key={role} disabled={submitting} onClick={() => choose(role)} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:border-navy-950 hover:bg-slate-50 dark:border-navy-700 dark:hover:border-white dark:hover:bg-navy-800"><div className="flex items-start justify-between"><div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-950 text-white dark:bg-white dark:text-navy-950"><Icon size={16} /></div><p className="mt-4 text-sm font-extrabold">{title}</p><p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-navy-300">{desc}</p></div><ArrowRight size={15} className="transition group-hover:translate-x-1" /></div></button>)}
          </div>
          {submitting && <div className="flex items-center justify-center gap-2 border-t border-slate-200 py-3 text-xs font-bold dark:border-navy-800"><Loader2 size={14} className="animate-spin" /> {t('landing.gate.starting')}</div>}
          {error && <p className="border-t border-signal-red/20 bg-signal-red/5 px-5 py-3 text-xs font-bold text-signal-red">{error}</p>}
        </div>
      </div>}
    </div>
  );
}
