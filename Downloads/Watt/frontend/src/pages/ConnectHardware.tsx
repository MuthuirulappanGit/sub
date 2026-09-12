import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Cpu, RefreshCw, Wifi, XCircle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Device, Room } from '../types';

type RegistrationForm = {
  room_id: string;
  name: string;
  device_token: string;
  mac_address: string;
};

const emptyForm: RegistrationForm = { room_id: '', name: '', device_token: '', mac_address: '' };

const sensorDefinitions = [
  { key: 'pir', name: 'PIR sensor', source: 'occupancy' },
  { key: 'electricity', name: 'Voltage sensor', source: 'voltage' },
  { key: 'current', name: 'Current sensor', source: 'current' },
] as const;

function connectionState(device: Device): string {
  if (device.telemetry) return device.status === 'WARNING' ? 'Connected/Online' : 'Connected/Online';
  if (device.status === 'OFFLINE' && !device.last_seen_at) return 'Waiting for Telemetry';
  if (device.status === 'OFFLINE') return 'Offline';
  return 'Waiting for Telemetry';
}

function statusClass(state: string): string {
  if (state === 'Connected/Online') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
  if (state === 'Error' || state === 'Offline') return 'text-rose-300 bg-rose-500/10 border-rose-500/30';
  return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
}

function SensorHealth({ value, hasTelemetry }: { value?: boolean; hasTelemetry: boolean }) {
  if (!hasTelemetry) return <span className="text-slate-500">Waiting for telemetry</span>;
  if (value === true) return <span className="text-emerald-300">Healthy</span>;
  if (value === false) return <span className="text-rose-300">Error</span>;
  return <span className="text-slate-400">Not reported</span>;
}

export const ConnectHardware: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  const load = useCallback(async () => {
    const [roomResponse, deviceResponse] = await Promise.all([
      apiRequest<{ data: Room[] }>('/rooms'),
      apiRequest<{ data: Device[] }>('/devices'),
    ]);
    setRooms(roomResponse.data || []);
    setDevices(deviceResponse.data || []);
  }, []);

  useEffect(() => {
    load().catch(() => setError('Unable to load rooms and registered hardware.'));
    const interval = setInterval(() => {
      load().catch(() => setError('Unable to refresh hardware telemetry.'));
    }, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const availableRooms = useMemo(() => rooms.filter((room) => !room.devices?.length), [rooms]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegistering(true);
    setMessage('');
    setError('');
    try {
      const response = await apiRequest<{ data: Device }>('/devices', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage(`ESP32 "${response.data.name}" registered. Waiting for genuine telemetry.`);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to register hardware.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-brand-400" /> Connect Hardware
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Register an ESP32-WROOM-32 and associate it with an existing room. Live values are read only from the ESP32 telemetry API.
        </p>
      </header>

      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>}
      {registering && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">Connection state: Registering</div>}
      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">Connection state: Error · {error}</div>}

      <form onSubmit={submit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="font-bold text-slate-100">Register ESP32-WROOM-32</h2>
          <p className="text-xs text-slate-500 mt-1">Only device identity and its room association are entered here.</p>
        </div>
        <select required value={form.room_id} onChange={(event) => setForm({ ...form, room_id: event.target.value })} className="w-full field">
          <option value="">Select existing room</option>
          {availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name} ({room.room_number})</option>)}
        </select>
        <div className="grid md:grid-cols-2 gap-4">
          <input required minLength={2} placeholder="Device name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full field" />
          <input required minLength={4} placeholder="ESP32 device token" value={form.device_token} onChange={(event) => setForm({ ...form, device_token: event.target.value })} className="w-full field" />
          <input required minLength={8} placeholder="MAC address" value={form.mac_address} onChange={(event) => setForm({ ...form, mac_address: event.target.value })} className="w-full field" />
          <div className="field text-slate-400" aria-label="Hardware type">Hardware type: ESP32-WROOM-32</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-400"><Wifi className="w-4 h-4 inline mr-2 text-brand-400" />Connection method: Wi-Fi / HTTP telemetry</div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-500">Registration never marks a device online.</div>
        </div>
        <button disabled={registering || !availableRooms.length} className="w-full py-2 rounded-xl bg-brand-500 text-slate-950 font-bold disabled:opacity-40">
          {registering ? 'Registering…' : 'Register ESP32 to Room'}
        </button>
        {!availableRooms.length && <p className="text-xs text-amber-300">Every existing room already has a device, or no rooms have been created.</p>}
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-slate-100">Registered hardware</h2><p className="text-xs text-slate-500">Status refreshes every 5 seconds from the existing backend telemetry state.</p></div>
          <button onClick={() => load().catch(() => setError('Unable to refresh hardware telemetry.'))} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800" aria-label="Refresh hardware"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {!devices.length && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">Connection state: Not Connected<br /><span className="text-xs">No ESP32 devices registered.</span></div>}
        {devices.map((device) => {
          const state = connectionState(device);
          const sensorStatus = device.telemetry?.sensor_status;
          return (
            <article key={device.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-bold text-slate-100 flex items-center gap-2"><Cpu className="w-4 h-4 text-brand-400" />{device.name}</h3><p className="text-xs text-slate-500 mt-1">{device.id} · Room: {device.room_name || 'Unassigned'}</p></div>
                <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${statusClass(state)}`}>{state}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <Info label="Hardware type" value="ESP32-WROOM-32" />
                <Info label="Connection method" value="Wi-Fi / HTTP" />
                <Info label="MAC address" value={device.mac_address} />
                <Info label="Firmware version" value={device.firmware_version || 'Not reported by ESP32'} />
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Sensor configuration & health</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {sensorDefinitions.map((sensor) => (
                    <div key={sensor.key} className="rounded-lg border border-slate-800 p-3">
                      <p className="text-sm text-slate-200">{sensor.name}</p>
                      <p className="text-[11px] text-slate-500 mt-1">GPIO: Firmware-defined (read-only)</p>
                      <p className="text-xs mt-3"><SensorHealth value={sensorStatus?.[sensor.key]} hasTelemetry={Boolean(device.telemetry)} /></p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <span><Activity className="w-3.5 h-3.5 inline mr-1 text-brand-400" />Last telemetry: {device.telemetry ? new Date(device.telemetry.timestamp).toLocaleString() : 'None received'}</span>
                <span>{device.telemetry ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 inline mr-1 text-slate-500" />}Telemetry source: ESP32 backend ingestion</span>
              </div>
              {device.telemetry && <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs"><Info label="Voltage" value={`${device.telemetry.voltage} V`} /><Info label="Current" value={`${device.telemetry.current} A`} /><Info label="Power" value={`${device.telemetry.power_watts} W`} /><Info label="Energy" value={`${device.telemetry.energy_kwh} kWh`} /><Info label="Occupancy" value={device.telemetry.occupancy ? 'Occupied' : 'Unoccupied'} /></div>}
            </article>
          );
        })}
      </section>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="text-slate-200 mt-1 break-words">{value}</p></div>
);
