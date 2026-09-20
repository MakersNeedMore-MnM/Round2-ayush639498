import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useTheme, useOpsData } from '../../context/AppProviders';
import { LANGUAGES } from '../../i18n';
import { Panel, PanelHeader, Button } from '../../components/ui';

export default function Settings() {
  const auth = useAuth();
  const theme = useTheme();
  const ops = useOpsData();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  async function handleLogout() {
    await auth.logout();
    navigate('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-navy-300">Preferences and session details</p>
      </div>

      <Panel>
        <PanelHeader title="Session" />
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-navy-500">Name</p>
            <p className="text-sm font-semibold text-navy-900 dark:text-white">{auth.user?.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-navy-500">Role</p>
            <p className="text-sm font-semibold text-navy-900 dark:text-white">{auth.isAdmin ? 'Administrator' : 'Resident'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-navy-500">District</p>
            <p className="text-sm font-semibold text-navy-900 dark:text-white">{ops.district}, {ops.state}</p>
          </div>
        </div>
        <div className="border-t border-slate-200 px-5 py-4 dark:border-navy-800">
          <Button variant="outline" onClick={handleLogout}><LogOut size={15} /> Sign out</Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Appearance" />
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-navy-900 dark:text-white">Theme</p>
            <p className="text-sm text-slate-500 dark:text-navy-300">Switch between light and dark mode</p>
          </div>
          <Button variant="outline" onClick={theme.toggleTheme}>
            {theme.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme.theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Language" subtitle="Interface language" />
        <div className="grid grid-cols-2 gap-2 px-5 py-5 sm:grid-cols-4">
          {LANGUAGES.map(function renderLang([code, label]) {
            return (
              <button
                key={code}
                onClick={function pick() { i18n.changeLanguage(code); }}
                className={'border px-3 py-2 text-sm font-semibold ' + (i18n.language === code ? 'border-navy-900 bg-navy-900 text-white dark:border-white dark:bg-white dark:text-navy-950' : 'border-slate-300 text-navy-700 dark:border-navy-700 dark:text-navy-200')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
