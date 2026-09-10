import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  DoorOpen,
  BarChart3,
  Lightbulb,
  Radio,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/live', label: 'Live Energy Grid', icon: Activity },
    { to: '/wastage', label: 'Wastage Incidents', icon: AlertTriangle },
    { to: '/rooms', label: 'Rooms & Devices', icon: DoorOpen },
    { to: '/analytics', label: 'Analytics & EUI', icon: BarChart3 },
    { to: '/recommendations', label: 'AI Savings Plan', icon: Lightbulb },
    { to: '/simulator', label: 'IoT Simulator UI', icon: Radio },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          Monitoring & Control
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-xs">
        <div className="flex items-center gap-2 text-brand-400 font-semibold mb-1">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          Wastage Engine v2.4
        </div>
        <p className="text-slate-400 text-[11px]">
          Rule-based & AI telemetry analysis running continuously.
        </p>
      </div>
    </aside>
  );
};
