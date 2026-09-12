import { Request, Response } from 'express';
import { AuditLog, WastageAlert, Room } from '../db/schema.js';

export async function getNotifications(_req: Request, res: Response) {
  const [events, alerts, rooms] = await Promise.all([
    AuditLog.find({ action: { $in: ['ROOM_CREATED', 'DEVICE_CONNECTED'] } }).sort({ timestamp: -1 }).limit(50).lean(),
    WastageAlert.find().sort({ created_at: -1 }).limit(50).lean(),
    Room.find().select('id name').lean(),
  ]);
  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));
  const notifications = [
    ...events.map((event) => ({ id: String(event._id), type: event.action, message: event.details, timestamp: event.timestamp, status: 'INFO' })),
    ...alerts.map((alert) => ({ id: alert.id, type: 'WASTAGE_ALERT', message: alert.title, timestamp: alert.created_at, status: alert.status, room: roomNames.get(alert.room_id) })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return res.json({ success: true, data: notifications });
}
