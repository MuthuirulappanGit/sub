import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap, IndianRupee } from 'lucide-react';
import { WastageAlert } from '../types';
import { Badge } from './Badge';
import { apiRequest } from '../api/client';

interface WastageAlertItemProps {
  alert: WastageAlert;
  onRefresh?: () => void;
}

export const WastageAlertItem: React.FC<WastageAlertItemProps> = ({ alert, onRefresh }) => {
  const handleAcknowledge = async () => {
    try {
      await apiRequest(`/wastage/alerts/${alert.id}/acknowledge`, { method: 'PATCH' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async () => {
    try {
      await apiRequest(`/wastage/alerts/${alert.id}/resolve`, { method: 'PATCH' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const severityVariant = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'neutral',
  }[alert.severity] as any;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-700">
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl mt-0.5 ${alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-100 text-sm">{alert.title}</h4>
            <Badge variant={severityVariant}>{alert.severity}</Badge>
            <Badge variant={alert.status === 'ACTIVE' ? 'danger' : alert.status === 'ACKNOWLEDGED' ? 'warning' : 'success'}>
              {alert.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">{alert.description}</p>

          <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {alert.power_w} W active
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              ₹{alert.estimated_cost.toFixed(2)} estimated loss
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center">
        {alert.status === 'ACTIVE' && (
          <button
            onClick={handleAcknowledge}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
          >
            Acknowledge
          </button>
        )}
        {alert.status !== 'RESOLVED' && (
          <button
            onClick={handleResolve}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Resolve
          </button>
        )}
      </div>
    </div>
  );
};
