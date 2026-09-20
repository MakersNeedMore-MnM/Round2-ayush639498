import React, { useMemo, useState } from 'react';
import { ListTree, Loader2, Users2, MapPinned, Clock, Send, ChevronDown } from 'lucide-react';
import { useAuth, useOpsData } from '../../context/AppProviders';
import { api } from '../../lib/api';
import { SeverityBadge, Badge, EmptyState } from '../../components/ui';

const STATUS_OPTIONS = ['UNVERIFIED', 'VERIFIED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
const BORDER_COLOR = { CRITICAL: 'border-l-signal-red', HIGH: 'border-l-signal-amber', MODERATE: 'border-l-navy-500', LOW: 'border-l-slate-300' };

export default function Incidents() {
  const ops = useOpsData();
  const auth = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const incidents = ops.data?.incidents || [];

  const filtered = useMemo(function apply() {
    const sorted = [...incidents].sort(function bySeverity(a, b) { return (b.priorityScore || 0) - (a.priorityScore || 0); });
    return filter === 'ALL' ? sorted : sorted.filter(function f(i) { return i.severity === filter; });
  }, [incidents, filter]);

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      await api('/incidents/' + id, { method: 'patch', data: { status } });
      ops.refresh();
    } finally {
      setUpdating(null);
    }
  }

  async function dispatch(id) {
    setUpdating(id);
    try {
      await api('/incidents/' + id + '/dispatch', { method: 'post' });
      ops.refresh();
    } catch (e) {
      /* surfaced via next refresh; keep the card interactive */
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">Incident Queue</h1>
        <p className="text-sm text-slate-500 dark:text-navy-300">{ops.district}, {ops.state} • verify, prioritise and dispatch response resources</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(function renderFilter(f) {
          return (
            <button key={f} onClick={function pick() { setFilter(f); }} className={'rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide ' + (filter === f ? 'border-navy-900 bg-navy-900 text-white dark:border-white dark:bg-white dark:text-navy-950' : 'border-slate-300 text-navy-700 dark:border-navy-700 dark:text-navy-200')}>
              {f}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900">
          <EmptyState icon={ListTree} title="No incidents match this filter" />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map(function renderCard(i) {
            const isUpdating = updating === i._id;
            const canDispatch = auth.isAdmin && ['VERIFIED', 'UNVERIFIED'].includes(i.status);
            const isExpanded = expanded === i._id;
            return (
              <div key={i._id} className={'rounded-2xl border border-l-4 border-slate-200 bg-white p-4 dark:border-navy-800 dark:bg-navy-900 ' + (BORDER_COLOR[i.severity] || BORDER_COLOR.LOW)}>
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge level={i.severity} />
                  <span className="font-mono text-xs font-bold text-slate-400">{i.code}</span>
                </div>
                <p className="mt-2 text-sm font-extrabold text-navy-950 dark:text-white">{(i.type || 'INCIDENT').replaceAll('_', ' ')}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-navy-300">{i.description || ((i.type || 'Incident').replaceAll('_', ' ') + ' reported near ' + (i.zone || i.location || ops.district) + '.')}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-navy-400">
                  <span className="flex items-center gap-1"><Users2 size={12} /> {i.peopleAffected || 1} affected</span>
                  <span className="flex items-center gap-1"><MapPinned size={12} /> {i.zone || i.location || ops.district}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {i.status}</span>
                </div>

                {isExpanded && (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600 dark:bg-navy-800/60 dark:text-navy-300">
                    {Array.isArray(i.priorityReasons) && i.priorityReasons.length ? (
                      <ul className="space-y-1">
                        {i.priorityReasons.map(function renderReason(r, idx) {
                          return <li key={idx} className="flex items-center justify-between gap-3"><span>{r.label}</span><span className="font-bold text-navy-700 dark:text-navy-200">+{r.points}</span></li>;
                        })}
                      </ul>
                    ) : (
                      <p>Priority score reflects incident type, people affected and reported flood severity.</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Priority score</p>
                    <p className="text-lg font-extrabold text-navy-950 dark:text-white">{i.priorityScore ?? '—'}<span className="text-xs font-bold text-slate-400">/100</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={function toggle() { setExpanded(isExpanded ? null : i._id); }} className="flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold dark:border-navy-700 dark:text-white">
                      Why? <ChevronDown size={13} className={isExpanded ? 'rotate-180 transition' : 'transition'} />
                    </button>
                    {auth.isAdmin ? (
                      canDispatch ? (
                        <button onClick={function go() { dispatch(i._id); }} disabled={isUpdating} className="flex items-center gap-1.5 rounded-full bg-navy-950 px-4 py-2 text-xs font-bold text-white hover:bg-navy-800 disabled:opacity-50 dark:bg-white dark:text-navy-950">
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Dispatch
                        </button>
                      ) : (
                        <select
                          defaultValue={i.status}
                          disabled={isUpdating}
                          onChange={function onChange(e) { updateStatus(i._id, e.target.value); }}
                          className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-navy-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                        >
                          {STATUS_OPTIONS.map(function renderOption(s) { return <option key={s} value={s}>{s}</option>; })}
                        </select>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
