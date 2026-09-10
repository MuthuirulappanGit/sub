import React from 'react';
import { Zap, Bell, User as UserIcon, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { summary, activeAlerts } = useTelemetry();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent">
              WattWise
            </span>
            <span className="text-[10px] text-brand-400 block font-mono font-medium -mt-1">
              IoT ENERGY OS
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2 ml-6 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300">
            {summary ? `${summary.total_power_kw} kW Live` : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/simulator"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>ESP32 Simulator</span>
        </Link>

        <Link to="/wastage" className="relative p-2 text-slate-400 hover:text-slate-200 transition">
          <Bell className="w-5 h-5" />
          {activeAlerts.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
              {activeAlerts.length}
            </span>
          )}
        </Link>

        {user && (
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-200">{user.name}</p>
              <p className="text-[10px] text-brand-400 uppercase tracking-wider font-mono">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
