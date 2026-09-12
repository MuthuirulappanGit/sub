import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Recommendation } from '../types';
import { Badge } from '../components/Badge';
import { Lightbulb, DollarSign, Leaf, CheckCircle, XCircle, Clock } from 'lucide-react';

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const res = await apiRequest('/analytics/recommendations');
      setRecommendations(res.data || []);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/analytics/recommendations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchRecommendations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            AI Energy Conservation Action Plan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated recommendations calculated from room load duration profiles and wastage frequency.
          </p>
        </div>
      </div>

      {/* Financial Savings Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider font-semibold">
                Potential Monthly Financial ROI
              </span>
              <div className="text-3xl font-extrabold text-slate-50 mt-1 font-mono">
                ${summary.potential_monthly_savings_usd} <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <DollarSign className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-sky-950/60 to-slate-900 border border-sky-500/20 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-sky-400 font-mono uppercase tracking-wider font-semibold">
                Projected CO2 Offsets
              </span>
              <div className="text-3xl font-extrabold text-slate-50 mt-1 font-mono">
                {summary.potential_monthly_co2_kg} <span className="text-xs text-slate-400 font-normal">kg CO2e / month</span>
              </div>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-400">
              <Leaf className="w-7 h-7" />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Cards */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Analyzing conservation opportunities...</div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-slate-700 transition"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info">{rec.category}</Badge>
                  <Badge
                    variant={
                      rec.status === 'IMPLEMENTED'
                        ? 'success'
                        : rec.status === 'ACCEPTED'
                        ? 'warning'
                        : rec.status === 'DISMISSED'
                        ? 'neutral'
                        : 'info'
                    }
                  >
                    {rec.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    {rec.building_name} {rec.room_name && `• ${rec.room_name}`}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-base">{rec.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
              </div>

              {/* Metrics & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 self-stretch lg:self-center pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Monthly Savings</span>
                    <div className="text-sm font-bold text-emerald-400">
                      ₹{rec.potential_savings_inr_monthly} ({rec.potential_savings_kwh_monthly} kWh)
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Payback Period</span>
                    <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {rec.payback_months === 0 ? 'Immediate' : `${rec.payback_months} mos`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rec.status === 'PROPOSED' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'ACCEPTED')}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Accept Plan
                    </button>
                  )}
                  {rec.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'IMPLEMENTED')}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-xl text-xs font-bold transition"
                    >
                      Mark Implemented
                    </button>
                  )}
                  {rec.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'DISMISSED')}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      title="Dismiss Recommendation"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
