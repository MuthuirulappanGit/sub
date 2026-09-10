import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { StatCard } from '../components/StatCard';
import { WastageAlertItem } from '../components/WastageAlertItem';
import { apiRequest } from '../api/client';
import { TelemetryPoint, WastageAlert } from '../types';
import { Zap, AlertTriangle, IndianRupee, DoorClosed, Activity, TrendingUp, Gauge, BatteryCharging, Siren } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const Dashboard: React.FC = () => {
  const { summary, buildings, activeAlerts, refreshTelemetry } = useTelemetry();
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [wastageStats, setWastageStats] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const historyRes = await apiRequest('/telemetry/history?hours=24');
        setTelemetryHistory(historyRes.data || []);

        const statsRes = await apiRequest('/wastage/stats');
        setWastageStats(statsRes.stats);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">Facility Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time IoT telemetry, energy load duration, and unoccupied wastage monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Telemetry Status: {summary?.telemetry_connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Load"
          value={`${summary?.total_power_kw || 0} kW`}
          subtitle="Across all campus facilities"
          icon={Zap}
          accentColor="text-amber-400 bg-amber-400/10"
        />
        <StatCard
          title="Current"
          value={`${summary?.total_current_a || 0} A`}
          subtitle="Latest valid telemetry"
          icon={Gauge}
          accentColor="text-sky-400 bg-sky-400/10"
        />
        <StatCard
          title="Energy"
          value={`${summary?.total_energy_kwh || 0} kWh`}
          subtitle="Latest meter readings"
          icon={BatteryCharging}
          accentColor="text-emerald-400 bg-emerald-400/10"
        />
        <StatCard
          title="Wastage Alerts"
          value={activeAlerts.length}
          subtitle={`${wastageStats?.critical_alerts_count || 0} critical incidents`}
          icon={AlertTriangle}
          accentColor="text-rose-400 bg-rose-400/10"
        />
        <StatCard
          title="Estimated Cost"
          value={`₹${(wastageStats?.total_cost_wasted_usd || 0).toFixed(2)}`}
          subtitle={`${wastageStats?.total_kwh_wasted || 0} kWh wasted`}
          icon={IndianRupee}
          accentColor="text-emerald-400 bg-emerald-400/10"
        />
        <StatCard
          title="Unoccupied Rooms"
          value={summary?.unoccupied_rooms || 0}
          subtitle="Confirmed by live PIR telemetry"
          icon={DoorClosed}
          accentColor="text-sky-400 bg-sky-400/10"
        />
        <StatCard
          title="Active Wastage Incidents"
          value={wastageStats?.active_alerts_count || 0}
          subtitle="Backend-detected conditions"
          icon={Siren}
          accentColor="text-rose-400 bg-rose-400/10"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 24-Hour Power Curve */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                24-Hour Campus Electrical Load Curve
              </h3>
              <p className="text-xs text-slate-400">Total active power draw (kW) sampled every 30 mins</p>
            </div>
            <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-400">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Area type="monotone" dataKey="power_kw" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#powerGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Building Load Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm mb-1">Building Load vs Budget</h3>
            <p className="text-xs text-slate-400 mb-4">Current active load vs targeted kW budget</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="kW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="power_kw" name="Current Load (kW)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget_kw" name="Target Budget (kW)" fill="#334155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500">
            Building comparison uses current measured telemetry only.
          </div>
        </div>
      </div>

      {/* Active Wastage Incidents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Active Unoccupied Wastage Incidents ({activeAlerts.length})
          </h3>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
            🎉 Great news! No active unoccupied wastage incidents detected across your facilities.
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert: WastageAlert) => (
              <WastageAlertItem key={alert.id} alert={alert} onRefresh={refreshTelemetry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
