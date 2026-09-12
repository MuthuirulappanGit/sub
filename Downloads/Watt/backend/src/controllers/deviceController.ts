import { Request, Response } from 'express';
import { z } from 'zod';
import { Device, Relay, Room, AuditLog } from '../db/schema.js';
import { randomUUID } from 'node:crypto';
import { getRecentTelemetry, markStaleDevicesOffline } from '../services/telemetryStatus.js';

export const registerDeviceSchema = z.object({
  room_id: z.string(),
  name: z.string().min(2),
  device_token: z.string().min(4),
  mac_address: z.string().min(8),
  firmware_version: z.string().optional(),
  ip_address: z.string().optional(),
});

export const toggleRelaySchema = z.object({
  is_on: z.boolean(),
});

export async function getDevices(req: Request, res: Response) {
  await markStaleDevicesOffline();
  const devices = await Device.find().lean();
  const relays = await Relay.find().lean();
  const rooms = await Room.find().lean();
  const recentTelemetry = await getRecentTelemetry();

  const enriched = devices.map((dev) => {
    const room = rooms.find((r) => r.id === dev.room_id);
    const devRelays = relays.filter((r) => r.device_id === dev.id);
    const telemetry = recentTelemetry.get(dev.id);

    return {
      ...dev,
      room_name: room ? room.name : 'Unassigned',
      relays: devRelays,
      telemetry: telemetry || null,
    };
  });

  return res.json({ success: true, data: enriched });
}

export async function registerDevice(req: Request, res: Response) {
  const { room_id, name, device_token, mac_address, firmware_version, ip_address } = req.body;

  const room = await Room.findOne({ id: room_id });
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const id = `dev_${randomUUID()}`;
  const device = await Device.create({
    id,
    room_id,
    name,
    device_token,
    mac_address,
    ...(firmware_version ? { firmware_version } : {}),
    ...(ip_address ? { ip_address } : {}),
    status: 'OFFLINE',
    last_seen_at: null,
    created_at: new Date(),
  });

  // Create 2 default relays for lighting and HVAC
  await Relay.create([
    {
      id: `relay_${id}_light`,
      device_id: id,
      name: 'Primary Lighting Circuit',
      relay_index: 0,
      is_on: true,
      load_type: 'LIGHTING',
      auto_cutoff_enabled: true,
    },
    {
      id: `relay_${id}_hvac`,
      device_id: id,
      name: 'HVAC / Climate Control',
      relay_index: 1,
      is_on: true,
      load_type: 'HVAC',
      auto_cutoff_enabled: true,
    },
  ]);
  await AuditLog.create({
    user_id: req.user?.id || null,
    action: 'DEVICE_CONNECTED',
    details: `ESP32 "${device.name}" was connected to room "${room.name}".`,
    timestamp: new Date(),
  });

  return res.status(201).json({ success: true, message: `ESP32 connected to ${room.name}.`, data: device });
}

export async function toggleRelay(req: Request, res: Response) {
  const { id } = req.params;
  const { is_on } = req.body;

  const relay = await Relay.findOne({ id });
  if (!relay) {
    return res.status(404).json({ success: false, message: 'Relay not found' });
  }

  relay.is_on = is_on;
  await relay.save();

  if (req.user) {
    await AuditLog.create({
      user_id: req.user.id,
      action: 'RELAY_TOGGLE',
      details: `Relay "${relay.name}" (${relay.id}) turned ${is_on ? 'ON' : 'OFF'} by ${req.user.email}`,
      timestamp: new Date(),
    });
  }

  return res.json({ success: true, message: `Relay state updated to ${is_on ? 'ON' : 'OFF'}`, data: relay });
}
