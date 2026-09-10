import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { BarChart3, Leaf, DollarSign, Building2, Download, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await apiRequest('/analytics/summary');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7', '#6366f1'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-400" />
            Energy Use Intensity (EUI) & Carbon Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comparative EUI metrics ($kWh/ft^2$/yr), building load profiles, and emissions audit.
          </p>
        </div>

        <button
          onClick={() => alert('Generating WattWise Sustainability Compliance Report PDF...')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-brand-400" />
          Export Report
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Computing building EUI benchmarks...</div>
      ) : (
        <>
          {/* EUI Benchmark Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.eui_benchmarks?.map((bldg: any) => (
              <div key={bldg.building_id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-brand-400">{bldg.code}</span>
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <h3 className="font-bold text-slate-100 text-base mt-1">{bldg.building_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{bldg.area_sqft.toLocaleString()} sq ft</p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">EUI Index</span>
                    <div className="text-xl font-extrabold text-slate-50 font-mono mt-0.5">
                      {bldg.eui_kwh_per_sqft} <span className="text-xs text-slate-400 font-normal">kWh/ft²</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Est. Annual KWh</span>
                    <div className="text-sm font-bold text-sky-400 font-mono mt-1">
                      {bldg.annual_kwh_estimate.toLocaleString()} kWh
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EUI Comparison */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Building EUI Comparison (kWh / sq ft / year)
              </h3>
              <p className="text-xs text-slate-400 mb-4">Lower EUI indicates higher building energy efficiency.</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.eui_benchmarks || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="eui_kwh_per_sqft" name="EUI (kWh/sqft)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Room Type Power Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 mb-1">
                  <Leaf className="w-4 h-4 text-sky-400" />
                  Electrical Load by Room Category (kW)
                </h3>
                <p className="text-xs text-slate-400 mb-4">Breakdown of current active load across room types.</p>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.category_breakdown || []}
                        dataKey="power_kw"
                        nameKey="room_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ room_type, power_kw }) => `${room_type}: ${power_kw}kW`}
                      >
                        {data?.category_breakdown?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
