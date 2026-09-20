import React from 'react';
import { Bell } from 'lucide-react';
import { useOpsData } from '../../context/AppProviders';
import { Panel, PanelHeader, EmptyState, Badge } from '../../components/ui';

export default function Notifications() {
  const ops = useOpsData();
  const live = ops.notifications;
  const stored = ops.data?.notifications || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">Notifications</h1>
        <p className="text-sm text-slate-500 dark:text-navy-300">Real time updates and district notices</p>
      </div>

      {live.length > 0 ? (
        <Panel>
          <PanelHeader title="Live updates this session" />
          <ul className="divide-y divide-slate-100 dark:divide-navy-800">
            {live.map(function renderLive(n) {
              return (
                <li key={n.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm text-navy-800 dark:text-navy-100">{n.message || n.title || 'Update received'}</span>
                  <Badge tone="info">Live</Badge>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="District notices" subtitle={stored.length + ' notices on record'} />
        {stored.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" subtitle="You are all caught up." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-navy-800">
            {stored.map(function renderNotice(n) {
              return (
                <li key={n._id} className="px-5 py-3">
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-navy-300">{n.message}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
