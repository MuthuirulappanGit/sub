import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Room } from '../types';
import { Badge } from '../components/Badge';
import { Activity, Zap, Users, AlertTriangle, RefreshCw, Cpu, Radio } from 'lucide-react';

export const LiveMonitor: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await apiRequest('/rooms');
      setRooms(res.data || []);
    } catch (err) {
      console.error('Failed to fetch live room telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000); // 3s polling for real-time live grid
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-400" />
            Live Energy Grid & Room Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sub-second streaming telemetry from ESP32 microcontrollers across campus rooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRooms}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading live telemetry stream...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const device = room.devices?.[0];
            const hasTelemetry = room.has_telemetry === true && device?.status !== 'OFFLINE';
            const isWastage = hasTelemetry && !room.is_occupied && room.current_power_w > room.power_threshold_watts;

            return (
              <div
                key={room.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
                  isWastage
                    ? 'border-rose-500/50 shadow-rose-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isWastage && (
                  <div className="absolute top-0 right-0 left-0 bg-rose-500/20 border-b border-rose-500/30 px-3 py-1 text-[11px] font-bold text-rose-400 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    UNOCCUPIED WASTAGE DETECTED
                  </div>
                )}

                <div className={`flex items-start justify-between ${isWastage ? 'mt-6' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm">{room.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Room {room.room_number} • {room.room_type}</p>
                  </div>
                  <Badge variant={!hasTelemetry ? 'neutral' : room.is_occupied ? 'success' : 'warning'}>
                    <Users className="w-3 h-3 mr-1" />
                    {!device ? 'NOT CONNECTED' : !hasTelemetry ? 'WAITING FOR TELEMETRY' : room.is_occupied ? 'OCCUPIED' : 'UNOCCUPIED'}
                  </Badge>
                </div>

                {/* Meter Gauges */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Active Load</span>
                    <div className="text-xl font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                      <Zap className="w-4 h-4 text-amber-400" />
                      {hasTelemetry ? room.current_power_w : 0} W
                    </div>
                    <span className="text-[10px] text-slate-500">{hasTelemetry ? `Threshold: ${room.power_threshold_watts}W` : 'Waiting for telemetry'}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Hardware health</span>
                    <div className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-sky-400" />
                      {device ? device.status : 'Not configured'}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {hasTelemetry ? 'Telemetry receiving' : 'No recent telemetry'}
                    </span>
                  </div>
                </div>

                {/* Smart Relays */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Hardware sensors</span>
                    <div className="text-xs text-slate-400 mt-2">
                      PIR: {hasTelemetry && room.sensor_status?.pir !== false ? 'Receiving' : 'Waiting'} · Current: {hasTelemetry && room.sensor_status?.current !== false ? 'Receiving' : 'Waiting'} · Electricity: {hasTelemetry && room.sensor_status?.electricity !== false ? 'Receiving' : 'Waiting'}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
