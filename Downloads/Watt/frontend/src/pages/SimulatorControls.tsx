import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Room } from '../types';
import { Radio, Play, Square, Zap, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export const SimulatorControls: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [powerWatts, setPowerWatts] = useState(850);
  const [occupancy, setOccupancy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatusAndRooms = async () => {
    try {
      const statusRes = await apiRequest('/simulator/status');
      setIsRunning(statusRes.isRunning);

      const roomsRes = await apiRequest('/rooms');
      setRooms(roomsRes.data || []);
      if (roomsRes.data?.length && !selectedRoomId) {
        setSelectedRoomId(roomsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatusAndRooms();
  }, []);

  const handleToggleSimulator = async () => {
    try {
      if (isRunning) {
        await apiRequest('/simulator/stop', { method: 'POST' });
        setIsRunning(false);
      } else {
        await apiRequest('/simulator/start', { method: 'POST' });
        setIsRunning(true);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerSpike = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await apiRequest('/simulator/trigger-spike', {
        method: 'POST',
        body: JSON.stringify({
          roomId: selectedRoomId,
          powerWatts,
          occupancy,
        }),
      });
      setMessage(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
            <Radio className="w-6 h-6 text-amber-400" />
            ESP32 Telemetry & Wastage Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactively simulate ESP32 room microcontrollers and test automated wastage alert interlocks.
          </p>
        </div>

        <button
          onClick={handleToggleSimulator}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
            isRunning
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
              : 'bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-brand-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-4 h-4" />
              Stop Background Worker
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Live Multi-Room Worker
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trigger Custom Telemetry Event */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Inject Custom Wastage Anomaly
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a room and force a telemetry reading to test the automated Wastage Engine and relay cutoff.
            </p>
          </div>

          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {message}
            </div>
          )}

          <form onSubmit={handleTriggerSpike} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Threshold: {r.power_threshold_watts}W)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Active Power Draw (Watts)</label>
              <input
                type="number"
                value={powerWatts}
                onChange={(e) => setPowerWatts(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Room Occupancy State:</label>
              <button
                type="button"
                onClick={() => setOccupancy(!occupancy)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                  occupancy
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {occupancy ? 'OCCUPIED (PIR Motion)' : 'UNOCCUPIED (Vacant)'}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-brand-500 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Inject Telemetry Payload
            </button>
          </form>
        </div>

        {/* Live Simulation Instructions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-base">How WattWise Handles Wastage</h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 font-bold font-mono flex items-center justify-center text-xs shrink-0">1</span>
              <div>
                <p className="font-semibold text-slate-200">ESP32 Sensor Telemetry</p>
                <p className="text-slate-400 mt-0.5">ESP32 transmits voltage, current, power factor, and PIR occupancy states.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold font-mono flex items-center justify-center text-xs shrink-0">2</span>
              <div>
                <p className="font-semibold text-slate-200">Wastage Rule Evaluation</p>
                <p className="text-slate-400 mt-0.5">If <code className="text-amber-400">occupancy == false</code> and power draw exceeds threshold, a Wastage Incident is opened.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold font-mono flex items-center justify-center text-xs shrink-0">3</span>
              <div>
                <p className="font-semibold text-slate-200">Automated Smart Relay Cutoff</p>
                <p className="text-slate-400 mt-0.5">For High/Critical severity alerts, smart relays connected to non-essential loads are immediately toggled OFF.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
