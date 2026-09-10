import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'text-brand-500 bg-brand-500/10',
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden transition-all hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${accentColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold text-slate-50 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs font-medium">
          <span className={trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}>{trend.value}</span>
          <span className="text-slate-400 ml-1.5">vs last 24h</span>
        </div>
      )}
    </div>
  );
};
