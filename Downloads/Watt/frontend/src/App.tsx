import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { WastageAlerts } from './pages/WastageAlerts';
import { RoomsAndDevices } from './pages/RoomsAndDevices';
import { Analytics } from './pages/Analytics';
import { Recommendations } from './pages/Recommendations';
import { SimulatorControls } from './pages/SimulatorControls';
import { NotFound } from './pages/NotFound';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-brand-400 font-mono">
        ⚡ Initializing WattWise IoT Workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <TelemetryProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </TelemetryProvider>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveMonitor />} />
            <Route path="/wastage" element={<WastageAlerts />} />
            <Route path="/rooms" element={<RoomsAndDevices />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/simulator" element={<SimulatorControls />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
