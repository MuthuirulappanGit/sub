import { Request, Response } from 'express';
import { z } from 'zod';
import { Building, Room, Device, Relay, WastageAlert, AuditLog } from '../db/schema.js';
import { getRecentTelemetry } from '../services/telemetryStatus.js';

export const createBuildingSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  address: z.string().min(5),
  total_floors: z.number().int().min(1).default(1),
  area_sqft: z.number().positive().default(10000),
  target_power_budget_kw: z.number().positive().default(50),
});

export const createRoomSchema = z.object({
  building_id: z.string().default('default'),
  name: z.string().min(2),
  room_number: z.string().min(1),
  floor_number: z.number().int().min(0).default(1),
  room_type: z.enum(['CLASSROOM', 'LABORATORY', 'COMPUTER_LAB', 'SERVER_ROOM', 'FACULTY_OFFICE', 'CONFERENCE_ROOM', 'CAFETERIA']),
  area_sqft: z.number().positive().default(500),
  power_threshold_watts: z.number().positive().default(100),
});

export async function getBuildings(req: Request, res: Response) {
  const buildings = await Building.find().lean();
  const rooms = await Room.find().lean();
  const devices = await Device.find().lean();
  const recentTelemetry = await getRecentTelemetry();
  const alerts = await WastageAlert.find({ status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } }).lean();

  const enriched = buildings.map((bldg) => {
    const bldgRooms = rooms.filter((r) => r.building_id === bldg.id);
    const bldgActivePowerW = bldgRooms.reduce((sum, r) => {
      const device = devices.find((candidate) => candidate.room_id === r.id);
      return sum + (device ? recentTelemetry.get(device.id)?.power_watts ?? 0 : 0);
    }, 0);
    const bldgActiveAlerts = alerts.filter((a) => bldgRooms.some((r) => r.id === a.room_id)).length;
    const occupiedRoomsCount = bldgRooms.filter((r) => {
      const device = devices.find((candidate) => candidate.room_id === r.id);
      return device ? recentTelemetry.get(device.id)?.occupancy ?? false : false;
    }).length;

    return {
      ...bldg,
      room_count: bldgRooms.length,
      occupied_room_count: occupiedRoomsCount,
      current_power_kw: parseFloat((bldgActivePowerW / 1000).toFixed(2)),
      active_alerts_count: bldgActiveAlerts,
    };
  });

  return res.json({ success: true, data: enriched });
}

export async function getBuildingById(req: Request, res: Response) {
  const { id } = req.params;
  const building = await Building.findOne({ id }).lean();
  if (!building) {
    return res.status(404).json({ success: false, message: 'Building not found' });
  }

  const rooms = await Room.find({ building_id: id }).lean();
  const roomIds = rooms.map((r) => r.id);
  const devices = await Device.find({ room_id: { $in: roomIds } }).lean();
  const recentTelemetry = await getRecentTelemetry();
  const alerts = await WastageAlert.find({ room_id: { $in: roomIds }, status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } }).lean();
  const liveRooms = rooms.map((room) => {
    const device = devices.find((candidate) => candidate.room_id === room.id);
    const telemetry = device ? recentTelemetry.get(device.id) : undefined;
    return {
      ...room,
      current_power_w: telemetry?.power_watts ?? 0,
      is_occupied: telemetry?.occupancy ?? false,
      has_telemetry: Boolean(telemetry),
    };
  });

  return res.json({
    success: true,
    data: {
      ...building,
      rooms: liveRooms,
      device_count: devices.length,
      active_alerts: alerts,
    },
  });
}

export async function createBuilding(req: Request, res: Response) {
  const { name, code, address, total_floors, area_sqft, target_power_budget_kw } = req.body;
  const id = `bldg_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const existing = await Building.findOne({ code });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Building code already exists' });
  }

  const newBldg = await Building.create({
    id,
    name,
    code,
    address,
    total_floors,
    area_sqft,
    target_power_budget_kw,
    created_at: new Date(),
  });

  return res.status(201).json({ success: true, data: newBldg });
}

export async function getRooms(req: Request, res: Response) {
  const { building_id } = req.query;
  const query = building_id ? { building_id: String(building_id) } : {};
  const rooms = await Room.find(query).lean();
  const devices = await Device.find().lean();
  const relays = await Relay.find().lean();
  const alerts = await WastageAlert.find({ status: 'ACTIVE' }).lean();
  const recentTelemetry = await getRecentTelemetry();
  const recentDeviceIds = new Set(recentTelemetry.keys());

  const enrichedRooms = rooms.map((room) => {
    const roomDevices = devices.filter((d) => d.room_id === room.id);
    const roomDevIds = roomDevices.map((d) => d.id);
    const roomRelays = relays.filter((r) => roomDevIds.includes(r.device_id));
    const activeAlert = alerts.find((a) => a.room_id === room.id && recentDeviceIds.has(a.device_id));

    const liveTelemetry = roomDevices[0] ? recentTelemetry.get(roomDevices[0].id) : undefined;
    return {
      ...room,
      current_power_w: liveTelemetry?.power_watts ?? 0,
      is_occupied: liveTelemetry?.occupancy ?? false,
      has_telemetry: Boolean(liveTelemetry),
      sensor_status: liveTelemetry?.sensor_status || null,
      devices: roomDevices,
      relays: roomRelays,
      active_alert: activeAlert || null,
    };
  });

  return res.json({ success: true, data: enrichedRooms });
}

export async function createRoom(req: Request, res: Response) {
  const { building_id, name, room_number, floor_number, room_type, area_sqft, power_threshold_watts } = req.body;
  let building = await Building.findOne({ id: building_id });
  if (!building && building_id === 'default') {
    building = await Building.create({
      id: 'default',
      name: 'WattWise Facility',
      code: 'FACILITY',
      address: 'Configured by administrator',
      total_floors: 1,
      area_sqft: 1,
      target_power_budget_kw: 1,
    });
  }
  if (!building) {
    return res.status(404).json({ success: false, message: 'Building not found' });
  }

  const id = `room_${building.code.toLowerCase()}_${room_number.toLowerCase()}`;
  const newRoom = await Room.create({
    id,
    building_id,
    name,
    room_number,
    floor_number,
    room_type,
    area_sqft,
    power_threshold_watts,
    is_occupied: false,
    current_power_w: 0.0,
    created_at: new Date(),
  });
  await AuditLog.create({
    user_id: req.user?.id || null,
    action: 'ROOM_CREATED',
    details: `Room "${newRoom.name}" (${newRoom.room_number}) was created successfully.`,
    timestamp: new Date(),
  });

  return res.status(201).json({ success: true, message: `Room "${newRoom.name}" created successfully.`, data: newRoom });
}

export async function deleteRoom(req: Request, res: Response) {
  const roomId = z.string().min(1).max(100).safeParse(req.params.id);
  if (!roomId.success) {
    return res.status(400).json({ success: false, message: 'Invalid room ID' });
  }

  const id = roomId.data;
  const room = await Room.findOne({ id });

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const assignedDevice = await Device.findOne({ room_id: id }).lean();
  if (assignedDevice) {
    return res.status(409).json({
      success: false,
      message: 'Room cannot be deleted while an ESP32 device is assigned. Unassign the device first.',
    });
  }

  await Room.deleteOne({ id });

  if (req.user) {
    await AuditLog.create({
      user_id: req.user.id,
      action: 'ROOM_DELETE',
      details: `Room "${room.name}" (${id}) deleted by ${req.user.email}`,
      timestamp: new Date(),
    });
  }

  return res.json({ success: true, message: 'Room deleted successfully' });
}
