import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { WastageAlert } from '../types';
import { WastageAlertItem } from '../components/WastageAlertItem';
import { AlertTriangle, Filter, CheckCircle2, DollarSign, Zap } from 'lucide-react';

export const WastageAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<WastageAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadAlerts = async () => {
    try {
      let query = [];
      if (statusFilter !== 'ALL') query.push(`status=${statusFilter}`);
      if (severityFilter !== 'ALL') query.push(`severity=${severityFilter}`);
      const endpoint = query.length ? `/wastage/alerts?${query.join('&')}` : '/wastage/alerts';

      const res = await apiRequest(endpoint);
      setAlerts(res.data || []);

      const statsRes = await apiRequest('/wastage/stats');
      setStats(statsRes.stats);
      const notificationsRes = await apiRequest('/notifications');
      setNotifications(notificationsRes.data || []);
    } catch (err) {
      console.error('Failed to load wastage alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            Unoccupied Wastage Incident Response
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated anomaly detection flagging active loads running in vacant rooms.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cumulative Incident Impact */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono">Active Incidents</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">{stats.active_alerts_count}</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-400/20" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono">Cumulative Wasted Energy</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{stats.total_kwh_wasted} kWh</div>
            </div>
            <Zap className="w-8 h-8 text-amber-400/20" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono">Total Financial Loss</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">₹{(stats.total_cost_wasted || 0).toFixed(2)}</div>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-400/20" />
          </div>
        </div>
      )}

      {/* Incident List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-100 mb-3">Notifications</h2>
        {!notifications.length ? <p className="text-xs text-slate-400">No notifications available.</p> : (
          <div className="space-y-2">{notifications.slice(0, 10).map((notification) => (
            <div key={notification.id} className="flex items-start justify-between gap-4 rounded-xl bg-slate-950 p-3">
              <div><p className="text-xs font-semibold text-slate-200">{notification.message}</p>{notification.room && <p className="text-[11px] text-slate-500">Room: {notification.room}</p>}</div>
              <time className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(notification.timestamp).toLocaleString()}</time>
            </div>
          ))}</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading incident log...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-slate-200 font-bold text-sm">No Wastage Incidents Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no incidents matching your current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <WastageAlertItem key={alert.id} alert={alert} onRefresh={loadAlerts} />
          ))}
        </div>
      )}
    </div>
  );
};
