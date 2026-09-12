import React, { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiRequest } from '../api/client';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/analytics/summary').then((response) => setData(response.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const history = (data?.historical_telemetry || []).map((point: any) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    power: point.power_watts,
  }));

  const exportData = () => {
    if (!history.length) return;
    const csv = ['timestamp,power_watts,energy_kwh', ...(data.historical_telemetry || []).map((point: any) => `${point.timestamp},${point.power_watts},${point.energy_kwh}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wattwise-telemetry.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div><h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-brand-400" />AI Analytics</h1><p className="text-xs text-slate-400 mt-1">Historical load curves and energy consumption from stored telemetry.</p></div>
        <button onClick={exportData} disabled={!history.length} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold disabled:opacity-40"><Download className="w-4 h-4 inline mr-2" />Export Data</button>
      </header>
      {loading ? <div className="text-center py-12 text-xs text-slate-400">Loading analytics...</div> : !history.length ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-sm text-slate-400">No historical telemetry available</div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-bold text-slate-100 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-400" />Load Curves</h2>
          <div className="h-72 mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><XAxis dataKey="time" stroke="#64748b" /><YAxis stroke="#64748b" unit=" W" /><Tooltip /><Line type="monotone" dataKey="power" stroke="#22c55e" dot={false} name="Power" /></LineChart></ResponsiveContainer></div>
          {data?.peak && <p className="text-sm text-slate-300 mt-4">Peak Load: <strong>{data.peak.power_watts} W</strong> at {new Date(data.peak.timestamp).toLocaleString()}</p>}
        </div>
      )}
    </div>
  );
};
