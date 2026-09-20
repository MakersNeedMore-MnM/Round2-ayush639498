import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useOpsData } from '../../context/AppProviders';
import { Panel, PanelHeader, SeverityBadge, SourceTag, EmptyState } from '../../components/ui';

export default function Alerts() {
  const ops = useOpsData();
  const d = ops.data;
  const alerts = d?.alerts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">Official Alerts</h1>
        <p className="text-sm text-slate-500 dark:text-navy-300">{ops.district}, {ops.state} — government advisories and verified public notices</p>
      </div>

      <Panel>
        <PanelHeader title="Active advisories" subtitle={alerts.length + ' currently issued'} />
        {alerts.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No active alerts" subtitle="No official or verified advisories are currently issued for this district." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-navy-800">
            {alerts.map(function renderAlert(a) {
              return (
                <li key={a._id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">{a.title}</h3>
                    <div className="flex items-center gap-2">
                      <SourceTag type={a.sourceType} name={a.source} />
                      <SeverityBadge level={a.severity} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-navy-300">{a.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-500">
                    Issued {a.issuedAt ? new Date(a.issuedAt).toLocaleString() : 'recently'}
                    {a.expiresAt ? ' · Expires ' + new Date(a.expiresAt).toLocaleString() : ''}
                  </p>
                  {a.officialUrl ? <a href={a.officialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold uppercase tracking-wide text-signal-blue underline">View official source</a> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
