import React, { useEffect, useState } from 'react';
import { DoorOpen, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Room } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const emptyRoom = { building_id: 'default', name: '', room_number: '', floor_number: 1, room_type: 'CLASSROOM', area_sqft: 500, power_threshold_watts: 100 };

export const RoomsAndDevices: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState(emptyRoom);
  const [adding, setAdding] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'FACILITY_MANAGER';

  const loadRooms = async () => {
    const response = await apiRequest('/rooms');
    setRooms(response.data || []);
  };

  useEffect(() => { loadRooms().catch(() => setMessage('Unable to load rooms.')); }, []);

  const createRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await apiRequest('/rooms', { method: 'POST', body: JSON.stringify(newRoom) });
      setRooms((current) => [...current, { ...response.data, has_telemetry: false }]);
      setNewRoom(emptyRoom);
      setAdding(false);
      setMessage(`Room "${response.data.name}" was created successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create room.');
    }
  };

  const deleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await apiRequest(`/rooms/${encodeURIComponent(roomToDelete.id)}`, { method: 'DELETE' });
      setRooms((current) => current.filter((room) => room.id !== roomToDelete.id));
      setRoomToDelete(null);
      setMessage('Room deleted successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete room.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div><h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2"><DoorOpen className="w-6 h-6 text-brand-400" />Rooms</h1><p className="text-xs text-slate-400 mt-1">Create and manage rooms. Connect hardware from the separate hardware page.</p></div>
        {canManage && <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold"><Plus className="w-4 h-4 inline mr-2" />Add Room</button>}
      </header>
      {message && <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-200">{message}</div>}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400 uppercase text-[10px]"><tr><th className="p-4">Room</th><th className="p-4">Number</th><th className="p-4">Type</th><th className="p-4">Hardware</th><th className="p-4">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-800">{rooms.map((room) => <tr key={room.id}><td className="p-4 font-bold text-slate-100">{room.name}</td><td className="p-4 text-slate-400">{room.room_number}</td><td className="p-4 text-slate-400">{room.room_type}</td><td className="p-4 text-slate-400">{room.devices?.[0]?.name || 'Not connected'}</td><td className="p-4">{canManage && <button onClick={() => setRoomToDelete(room)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg" aria-label={`Delete ${room.name}`}><Trash2 className="w-4 h-4" /></button>}</td></tr>)}</tbody>
        </table>
        {!rooms.length && <p className="p-10 text-center text-sm text-slate-400">No rooms registered yet.</p>}
      </div>
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Create Room">
        <form onSubmit={createRoom} className="space-y-4">
          <input required placeholder="Room name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} className="w-full field" />
          <input required placeholder="Room number" value={newRoom.room_number} onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })} className="w-full field" />
          <select value={newRoom.room_type} onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })} className="w-full field"><option>CLASSROOM</option><option>LABORATORY</option><option>COMPUTER_LAB</option><option>SERVER_ROOM</option><option>FACULTY_OFFICE</option><option>CONFERENCE_ROOM</option><option>CAFETERIA</option></select>
          <input required type="number" min="1" value={newRoom.power_threshold_watts} onChange={(e) => setNewRoom({ ...newRoom, power_threshold_watts: Number(e.target.value) })} className="w-full field" />
          <button className="w-full py-2 rounded-xl bg-brand-500 text-slate-950 font-bold">Create Room</button>
        </form>
      </Modal>
      <Modal isOpen={Boolean(roomToDelete)} onClose={() => setRoomToDelete(null)} title="Delete Room">
        <p className="text-sm text-slate-300">Delete {roomToDelete?.name}? A room with connected hardware must be disconnected first.</p>
        <button onClick={deleteRoom} className="mt-5 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-sm">Delete</button>
      </Modal>
    </div>
  );
};
