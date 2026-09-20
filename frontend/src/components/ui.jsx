import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Recalculates a Leaflet map's internal size after mount and on any resize
// or orientation change. Without this a map that first renders while its
// container is still animating in (the mobile sidebar transition, a tab
// switch) can measure the wrong width and clip or overflow on phones.
// Drop <MapAutoSize/> as a child of any <MapContainer>.
export function MapAutoSize() {
  const map = useMap();
  useEffect(function fixSize() {
    const apply = function invalidate() { map.invalidateSize({ animate: false }); };
    const t = setTimeout(apply, 250);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    let observer;
    if (typeof ResizeObserver !== 'undefined' && map.getContainer()) {
      observer = new ResizeObserver(apply);
      observer.observe(map.getContainer());
    }
    return function cleanup() {
      clearTimeout(t);
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
      observer?.disconnect();
    };
  }, [map]);
  return null;
}

const SEVERITY_STYLE = {
  CRITICAL: 'bg-signal-red text-white',
  HIGH: 'bg-signal-amber text-white',
  WARNING: 'bg-signal-amber text-white',
  MODERATE: 'bg-navy-500 text-white dark:bg-navy-400',
  WATCH: 'bg-navy-500 text-white dark:bg-navy-400',
  LOW: 'bg-slate-400 text-white dark:bg-navy-700',
  OK: 'bg-signal-teal text-white'
};

export function Badge({ tone='default', children, className='' }) {
  const map = {
    default: 'bg-slate-100 text-navy-800 dark:bg-navy-800 dark:text-navy-100',
    danger: 'bg-signal-red/10 text-signal-red dark:bg-signal-red/20',
    warn: 'bg-signal-amber/10 text-signal-amber dark:bg-signal-amber/20',
    safe: 'bg-signal-teal/10 text-signal-teal dark:bg-signal-teal/20',
    info: 'bg-signal-blue/10 text-signal-blue dark:bg-signal-blue/20'
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${map[tone] || map.default} ${className}`}>{children}</span>;
}

export function SeverityBadge({ level }) {
  const cls = SEVERITY_STYLE[level] || SEVERITY_STYLE.LOW;
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${cls}`}>{level || 'LOW'}</span>;
}

export function SourceTag({ type, name }) {
  if (['DEMO','CACHED','FALLBACK'].includes(type)) return null;
  const tone = { OFFICIAL:'info', VERIFIED:'safe', COMMUNITY:'warn', OPERATOR:'info' }[type] || 'default';
  return <Badge tone={tone}>{type || 'DATA'}{name ? ` · ${name}` : ''}</Badge>;
}

export function Panel({ children, className='' }) {
  return <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(8,26,47,.05)] dark:border-navy-800 dark:bg-navy-900 dark:shadow-none ${className}`}>{children}</section>;
}

export function PanelHeader({ title, subtitle, action, eyebrow }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-navy-800">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400 dark:text-navy-500">{eyebrow}</p>}
      <h3 className="text-sm font-extrabold text-navy-950 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-navy-300">{subtitle}</p>}
    </div>
    {action}
  </div>;
}

export function StatCard({ label, value, suffix, icon: Icon, hint, tone='default' }) {
  const toneClass = tone === 'danger' ? 'text-signal-red' : tone === 'safe' ? 'text-signal-teal' : tone === 'warn' ? 'text-signal-amber' : 'text-navy-950 dark:text-white';
  return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-navy-800 dark:bg-navy-900 dark:shadow-none">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-500 dark:text-navy-300">{label}</span>
      {Icon && <Icon size={16} className="text-slate-400 dark:text-navy-400" />}
    </div>
    <div className={`mt-2 text-2xl font-extrabold tracking-tight ${toneClass}`}>{value ?? '—'}{suffix && <span className="ml-1 text-sm font-bold text-slate-500">{suffix}</span>}</div>
    {hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-navy-400">{hint}</p>}
  </div>;
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
    {Icon && <Icon size={25} className="mb-3 text-slate-300 dark:text-navy-600" />}
    <p className="text-sm font-bold text-navy-800 dark:text-navy-100">{title}</p>
    {subtitle && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-navy-400">{subtitle}</p>}
  </div>;
}

export function Button({ variant='primary', className='', children, ...props }) {
  const map = {
    primary: 'bg-navy-950 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-navy-100',
    danger: 'bg-navy-950 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100',
    outline: 'border border-slate-300 bg-white text-navy-900 hover:bg-slate-50 dark:border-navy-700 dark:bg-transparent dark:text-white dark:hover:bg-navy-800',
    ghost: 'text-navy-700 hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-800'
  };
  return <button {...props} className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${map[variant] || map.primary} ${className}`}>{children}</button>;
}

export function LoadingBar({ active }) {
  if (!active) return null;
  return <div className="h-0.5 w-full overflow-hidden bg-slate-100 dark:bg-navy-800"><div className="h-full w-1/3 animate-pulse bg-signal-amber" /></div>;
}

export function PageHeader({ eyebrow='RASHAK', title, subtitle, action }) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-400 dark:text-navy-500">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">{title}</h1>
    </div>
    {action}
  </div>;
}
