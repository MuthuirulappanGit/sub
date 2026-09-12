import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { apiRequest } from '../api/client';

export const Settings: React.FC = () => {
  const [tariffPerKwh, setTariffPerKwh] = useState(8);
  const [telemetryTimeoutSeconds, setTelemetryTimeoutSeconds] = useState(30);
  const [activeCurrentThreshold, setActiveCurrentThreshold] = useState(100);
  const [wastageAlertDurationSeconds, setWastageAlertDurationSeconds] = useState(300);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/settings').then((response) => {
      setTariffPerKwh(response.data.tariffPerKwh);
      setTelemetryTimeoutSeconds(response.data.telemetryTimeoutSeconds);
      setActiveCurrentThreshold(response.data.activeCurrentThreshold);
      setWastageAlertDurationSeconds(response.data.wastageAlertDurationSeconds);
    }).catch(() => setMessage('Unable to load settings.'));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({ tariffPerKwh, telemetryTimeoutSeconds, activeCurrentThreshold, wastageAlertDurationSeconds }),
      });
      setMessage('Settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save settings.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2"><SettingsIcon className="w-6 h-6 text-brand-400" />Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure tariff-based cost calculations and telemetry health.</p>
      </header>
      <form onSubmit={save} className="max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
        <label className="block text-sm text-slate-300">
          Electricity Tariff (₹ / kWh)
          <input type="number" min="0.01" step="0.01" value={tariffPerKwh} onChange={(event) => setTariffPerKwh(Number(event.target.value))} className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100" />
        </label>
        <label className="block text-sm text-slate-300">
          Active current threshold (A)
          <input type="number" min="0.01" step="0.01" value={activeCurrentThreshold} onChange={(event) => setActiveCurrentThreshold(Number(event.target.value))} className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100" />
        </label>
        <label className="block text-sm text-slate-300">
          Wastage alert duration (seconds)
          <input type="number" min="1" value={wastageAlertDurationSeconds} onChange={(event) => setWastageAlertDurationSeconds(Number(event.target.value))} className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100" />
        </label>
        <label className="block text-sm text-slate-300">
          Telemetry timeout (seconds)
          <input type="number" min="1" value={telemetryTimeoutSeconds} onChange={(event) => setTelemetryTimeoutSeconds(Number(event.target.value))} className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100" />
        </label>
        <button className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-sm">Save Settings</button>
        {message && <p className="text-xs text-slate-400">{message}</p>}
      </form>
    </div>
  );
};
