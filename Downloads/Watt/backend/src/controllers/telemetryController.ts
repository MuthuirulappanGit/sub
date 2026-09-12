import { Request, Response } from 'express';
import { z } from 'zod';
import { Device, Room, TelemetryLog, Building } from '../db/schema.js';
import { processTelemetryAndDetectWastage } from '../services/wastageEngine.js';
import { getRecentTelemetry, markStaleDevicesOffline } from '../services/telemetryStatus.js';

export const ingestTelemetrySchema = z.object({
  deviceToken: z.string(),
  voltage: z.number().positive(),
  current: z.number().nonnegative(),
  power: z.number().nonnegative(),
  energyKwh: z.number().nonnegative(),
  powerFactor: z.number().min(0).max(1).optional().default(0.95),
  occupancy: z.boolean(),
  temperature: z.number().optional().default(22.0),
  humidity: z.number().optional().default(45.0),
  sensorStatus: z.object({
    pir: z.boolean().optional(),
    current: z.boolean().optional(),
    electricity: z.boolean().optional(),
  }).optional(),
  timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid telemetry timestamp').optional(),
});

export async function ingestTelemetry(req: Request, res: Response) {
  const { deviceToken, voltage, current, power, energyKwh, powerFactor, occupancy, temperature, humidity, timestamp, sensorStatus } = req.body;

  const device = await Device.findOne({ device_token: deviceToken });
  if (!device) {
    return res.status(404).json({ success: false, message: 'Unrecognized ESP32 device token' });
  }

  const parsedTimestamp = timestamp ? new Date(timestamp) : new Date();

  await processTelemetryAndDetectWastage({
    deviceId: device.id,
    roomId: device.room_id,
    powerWatts: power,
    occupancy,
    voltage,
    current,
    energyKwh,
    powerFactor,
    temperature,
    humidity,
    timestamp: parsedTimestamp,
    sensorStatus,
  });

  return res.json({
    success: true,
    message: 'Telemetry logged and processed successfully',
    processed: {
      deviceId: device.id,
      powerWatts: power,
      occupancy,
      timestamp: parsedTimestamp,
    },
  });
}

export async function getLiveTelemetry(req: Request, res: Response) {
  const recentTelemetry = await getRecentTelemetry();
  await markStaleDevicesOffline();
  const rooms = await Room.find().lean();
  const devices = await Device.find().lean();
  const buildings = await Building.find().lean();

  const liveRooms: Array<{ building_id: string; current_power_w: number; is_occupied: boolean; has_telemetry: boolean; [key: string]: unknown }> = rooms.map((room) => {
    const device = devices.find((candidate) => candidate.room_id === room.id);
    const telemetry = device ? recentTelemetry.get(device.id) : undefined;
    return {
      ...room,
      building_id: room.building_id,
      current_power_w: telemetry?.power_watts ?? 0,
      is_occupied: telemetry?.occupancy ?? false,
      has_telemetry: Boolean(telemetry),
    };
  });
  const liveTelemetry = Array.from(recentTelemetry.values());
  const totalPowerW = liveTelemetry.reduce((sum, telemetry) => sum + telemetry.power_watts, 0);
  const totalCurrentA = liveTelemetry.reduce((sum, telemetry) => sum + telemetry.current, 0);
  const totalEnergyKwh = liveTelemetry.reduce((sum, telemetry) => sum + telemetry.energy_kwh, 0);
  const occupiedCount = liveRooms.filter((r) => r.has_telemetry && r.is_occupied).length;
  const unoccupiedCount = liveRooms.filter((r) => r.has_telemetry && !r.is_occupied).length;

  return res.json({
    success: true,
    summary: {
      total_power_kw: parseFloat((totalPowerW / 1000).toFixed(2)),
      total_power_w: Math.round(totalPowerW),
      total_current_a: parseFloat(totalCurrentA.toFixed(2)),
      total_energy_kwh: parseFloat(totalEnergyKwh.toFixed(3)),
      total_rooms: liveRooms.length,
      occupied_rooms: occupiedCount,
      unoccupied_rooms: unoccupiedCount,
      online_devices: liveTelemetry.length,
      telemetry_connected: liveTelemetry.length > 0,
    },
    buildings: buildings.map((bldg) => {
      const bldgRooms = liveRooms.filter((r) => r.building_id === bldg.id);
      const bldgPowerW = bldgRooms.reduce((sum, r) => sum + r.current_power_w, 0);
      return {
        id: bldg.id,
        name: bldg.name,
        code: bldg.code,
        power_kw: parseFloat((bldgPowerW / 1000).toFixed(2)),
        budget_kw: bldg.target_power_budget_kw,
        rooms: bldgRooms,
      };
    }),
  });
}

export async function getTelemetryHistory(req: Request, res: Response) {
  const recentTelemetry = await getRecentTelemetry();
  if (recentTelemetry.size === 0) {
    return res.json({ success: true, data: [] });
  }

  const { roomId, buildingId, hours = 24 } = req.query;
  const hoursNum = parseInt(String(hours), 10) || 24;
  const sinceDate = new Date(Date.now() - hoursNum * 3600 * 1000);

  let filter: any = { timestamp: { $gte: sinceDate } };

  if (roomId) {
    filter.room_id = String(roomId);
  } else if (buildingId) {
    const rooms = await Room.find({ building_id: String(buildingId) }).lean();
    filter.room_id = { $in: rooms.map((r) => r.id) };
  }

  const logs = await TelemetryLog.find(filter).sort({ timestamp: 1 }).lean();

  // Aggregate into 30-min time buckets for clean multi-line chart rendering
  const timeBuckets: { [key: string]: { timestamp: string; totalPowerW: number; occupancyCount: number; sampleCount: number } } = {};

  logs.forEach((log) => {
    const d = new Date(log.timestamp);
    d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
    const key = d.toISOString();

    if (!timeBuckets[key]) {
      timeBuckets[key] = { timestamp: key, totalPowerW: 0, occupancyCount: 0, sampleCount: 0 };
    }

    timeBuckets[key].totalPowerW += log.power_watts;
    if (log.occupancy) timeBuckets[key].occupancyCount++;
    timeBuckets[key].sampleCount++;
  });

  const chartData = Object.values(timeBuckets).map((b) => ({
    timestamp: b.timestamp,
    timeLabel: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    power_kw: parseFloat((b.totalPowerW / (b.sampleCount || 1) / 1000).toFixed(2)),
    power_watts: Math.round(b.totalPowerW / (b.sampleCount || 1)),
    is_occupied: b.occupancyCount > 0,
  }));

  return res.json({ success: true, data: chartData });
}
