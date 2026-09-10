import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Room, Device, Building } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, Cpu, Plus, Wifi, Layers, CheckCircle, Trash2 } from 'lucide-react';

export const RoomsAndDevices: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { user } = useAuth();
  const canDeleteRooms = user?.role === 'SUPER_ADMIN' || user?.role === 'FACILITY_MANAGER';

  // New Room Form State
  const [newRoom, setNewRoom] = useState({
    building_id: 'bldg_sci',
    name: '',
    room_number: '',
    floor_number: 1,
    room_type: 'LABORATORY',
    area_sqft: 800,
    power_threshold_watts: 150,
  });

  // New Device Form State
  const [newDevice, setNewDevice] = useState({
    room_id: '',
    name: '',
    device_token: '',
    mac_address: '',
  });

  const fetchData = async () => {
    try {
      const [roomsRes, devicesRes, bldgsRes] = await Promise.all([
        apiRequest('/rooms'),
        apiRequest('/devices'),
        apiRequest('/buildings'),
      ]);
      setRooms(roomsRes.data || []);
      setDevices(devicesRes.data || []);
      setBuildings(bldgsRes.data || []);
      if (roomsRes.data?.length && !newDevice.room_id) {
        setNewDevice((prev) => ({ ...prev, room_id: roomsRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load rooms and devices:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify(newRoom),
      });
      setIsAddRoomOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/devices', {
        method: 'POST',
        body: JSON.stringify(newDevice),
      });
      setIsAddDeviceOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete || isDeletingRoom) return;

    setIsDeletingRoom(true);
    setNotification(null);
    try {
      await apiRequest(`/rooms/${encodeURIComponent(roomToDelete.id)}`, { method: 'DELETE' });
      setRooms((currentRooms) => currentRooms.filter((room) => room.id !== roomToDelete.id));
      setRoomToDelete(null);
      setNotification({ type: 'success', message: 'Room deleted successfully.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Unable to delete room.' });
    } finally {
      setIsDeletingRoom(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-brand-400" />
            Rooms & Hardware Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure room thresholds, ESP32 microcontrollers, and relay load circuits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddRoomOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            Add New Room
          </button>
          <button
            onClick={() => setIsAddDeviceOpen(true)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-brand-500/20"
          >
            <Cpu className="w-4 h-4" />
            Register ESP32 Device
          </button>
        </div>
      </div>

      {/* Buildings & Rooms Overview */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          Campus Rooms ({rooms.length})
        </h3>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Room Name</th>
                  <th className="px-5 py-3">Building & Number</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Threshold</th>
                  <th className="px-5 py-3">Current Load</th>
                  <th className="px-5 py-3">Assigned Device</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  {canDeleteRooms && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {rooms.map((room) => {
                  const dev = devices.find((d) => d.room_id === room.id);
                  const bldg = buildings.find((b) => b.id === room.building_id);

                  return (
                    <tr key={room.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-bold text-slate-100">{room.name}</td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {bldg?.code || 'SCI'} - Room {room.room_number} (F{room.floor_number})
                      </td>
                      <td className="px-5 py-4 font-mono">{room.room_type}</td>
                      <td className="px-5 py-4 text-amber-400 font-mono font-semibold">{room.power_threshold_watts} W</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-200">{room.current_power_w} W</td>
                      <td className="px-5 py-4 font-mono text-slate-300">
                        {dev ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <Wifi className="w-3.5 h-3.5" />
                            {dev.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            room.is_occupied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {room.is_occupied ? 'OCCUPIED' : 'VACANT'}
                        </span>
                      </td>
                      {canDeleteRooms && (
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setRoomToDelete(room)}
                            title="Delete Room"
                            aria-label={`Delete ${room.name}`}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {notification && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl ${
            notification.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {notification.message}
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-3 text-current/70 hover:text-current"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <Modal
        isOpen={Boolean(roomToDelete)}
        onClose={() => {
          if (!isDeletingRoom) setRoomToDelete(null);
        }}
        title="Delete Room?"
      >
        {roomToDelete && (
          <div className="space-y-5">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <strong className="text-slate-100">"{roomToDelete.name}"</strong>? This
              action cannot be undone.
            </p>
            {devices.some((device) => device.room_id === roomToDelete.id) && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                This room currently has an assigned ESP32 device. Unassign the device before deleting the room.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                disabled={isDeletingRoom}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={isDeletingRoom || devices.some((device) => device.room_id === roomToDelete.id)}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingRoom ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Room Modal */}
      <Modal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} title="Add New Campus Room">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Building</label>
            <select
              value={newRoom.building_id}
              onChange={(e) => setNewRoom({ ...newRoom, building_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room Name</label>
              <input
                type="text"
                required
                placeholder="Microbiology Lab 2"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room Number</label>
              <input
                type="text"
                required
                placeholder="204"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room Type</label>
              <select
                value={newRoom.room_type}
                onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              >
                <option value="LABORATORY">LABORATORY</option>
                <option value="CLASSROOM">CLASSROOM</option>
                <option value="COMPUTER_LAB">COMPUTER_LAB</option>
                <option value="SERVER_ROOM">SERVER_ROOM</option>
                <option value="FACULTY_OFFICE">FACULTY_OFFICE</option>
                <option value="CONFERENCE_ROOM">CONFERENCE_ROOM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Wastage Threshold (Watts)</label>
              <input
                type="number"
                required
                value={newRoom.power_threshold_watts}
                onChange={(e) => setNewRoom({ ...newRoom, power_threshold_watts: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm mt-4 hover:bg-brand-600 transition"
          >
            Create Room
          </button>
        </form>
      </Modal>

      {/* Register ESP32 Device Modal */}
      <Modal isOpen={isAddDeviceOpen} onClose={() => setIsAddDeviceOpen(false)} title="Register New ESP32 Microcontroller">
        <form onSubmit={handleRegisterDevice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assign to Room</label>
            <select
              value={newDevice.room_id}
              onChange={(e) => setNewDevice({ ...newDevice, room_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Room {r.room_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Device Friendly Name</label>
            <input
              type="text"
              required
              placeholder="ESP32 Node - Physics 303"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Device Token ID</label>
              <input
                type="text"
                required
                placeholder="esp32_token_303"
                value={newDevice.device_token}
                onChange={(e) => setNewDevice({ ...newDevice, device_token: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">MAC Address</label>
              <input
                type="text"
                required
                placeholder="24:0A:C4:00:03:04"
                value={newDevice.mac_address}
                onChange={(e) => setNewDevice({ ...newDevice, mac_address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-brand-500 text-slate-950 font-bold rounded-xl text-sm mt-4 hover:bg-brand-600 transition"
          >
            Register Device & Provision Relays
          </button>
        </form>
      </Modal>
    </div>
  );
};
