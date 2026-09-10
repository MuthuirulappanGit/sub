import React, { useState } from 'react';
import { Power } from 'lucide-react';
import { Relay } from '../types';
import { apiRequest } from '../api/client';

interface RelayToggleProps {
  relay: Relay;
  onUpdate?: () => void;
}

export const RelayToggle: React.FC<RelayToggleProps> = ({ relay, onUpdate }) => {
  const [isOn, setIsOn] = useState(relay.is_on);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const newState = !isOn;
    try {
      await apiRequest(`/relays/${relay.id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ is_on: newState }),
      });
      setIsOn(newState);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to toggle relay:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
      <div>
        <p className="text-sm font-semibold text-slate-200">{relay.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400 uppercase font-mono">{relay.load_type}</span>
          {relay.auto_cutoff_enabled && (
            <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded font-mono">
              Auto-Cutoff
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
          isOn
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Power className={`w-3.5 h-3.5 ${isOn ? 'text-emerald-400' : 'text-rose-400'}`} />
        <span>{isOn ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
};
