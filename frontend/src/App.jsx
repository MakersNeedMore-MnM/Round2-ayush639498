import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, AuthProvider, DataProvider, useAuth } from './context/AppProviders';
import { DashboardLayout } from './components/layout';
import Landing from './pages/Landing';
import Overview from './pages/dashboard/Overview';
import LiveMap from './pages/dashboard/LiveMap';
import Alerts from './pages/dashboard/Alerts';
import SOS from './pages/dashboard/SOS';
import Shelters from './pages/dashboard/Shelters';
import Evacuation from './pages/dashboard/Evacuation';
import LocalMesh from './pages/dashboard/LocalMesh';
import Incidents from './pages/dashboard/Incidents';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';
import RescueOperations from './pages/dashboard/RescueOperations';
import RescueTracking from './pages/dashboard/RescueTracking';
import RoadNetwork from './pages/dashboard/RoadNetwork';
import EmergencyContacts from './pages/dashboard/EmergencyContacts';

function ProtectedArea(props) {
  const auth = useAuth();
  if (auth.checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-navy-950">
        <p className="text-sm font-bold uppercase tracking-wide text-navy-500 dark:text-navy-300">Loading Rashak</p>
      </div>
    );
  }
  if (!auth.user) return <Navigate to="/" replace />;
  return <DataProvider>{props.children}</DataProvider>;
}


function RoleGate({ children, roles }) {
  const auth = useAuth();
  if (!roles.includes(auth.user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<ProtectedArea><DashboardLayout /></ProtectedArea>}>
              <Route index element={<Overview />} />
              <Route path="map" element={<LiveMap />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="sos" element={<SOS />} />
              <Route path="shelters" element={<Shelters />} />
              <Route path="evacuation" element={<Evacuation />} />
              <Route path="mesh" element={<LocalMesh />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="rescue-operations" element={<RoleGate roles={['ADMIN','DISTRICT_OFFICER']}><RescueOperations /></RoleGate>} />
              <Route path="rescue-tracking" element={<RoleGate roles={['ADMIN','DISTRICT_OFFICER']}><RescueTracking /></RoleGate>} />
              <Route path="road-network" element={<RoleGate roles={['ADMIN','DISTRICT_OFFICER']}><RoadNetwork /></RoleGate>} />
              <Route path="emergency-contacts" element={<EmergencyContacts />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
