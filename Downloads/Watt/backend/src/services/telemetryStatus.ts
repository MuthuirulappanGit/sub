import { Device, TelemetryLog } from '../db/schema.js';
import { env } from '../config/env.js';

export const TELEMETRY_MAX_AGE_MS = env.TELEMETRY_TIMEOUT_SECONDS * 1000;

export interface RecentTelemetry {
  device_id: string;
  room_id: string;
  voltage: number;
  current: number;
  power_watts: number;
  energy_kwh: number;
  occupancy: boolean;
  timestamp: Date;
}

export async function getRecentTelemetry(): Promise<Map<string, RecentTelemetry>> {
  const since = new Date(Date.now() - TELEMETRY_MAX_AGE_MS);
  const logs = await TelemetryLog.find({ timestamp: { $gte: since } }).sort({ timestamp: -1 }).lean();
  const latestByDevice = new Map<string, RecentTelemetry>();

  for (const log of logs) {
    if (!latestByDevice.has(log.device_id)) {
      latestByDevice.set(log.device_id, {
        device_id: log.device_id,
        room_id: log.room_id,
        voltage: log.voltage,
        current: log.current,
        power_watts: log.power_watts,
        energy_kwh: log.energy_kwh,
        occupancy: log.occupancy,
        timestamp: log.timestamp,
      });
    }
  }

  return latestByDevice;
}

export async function markStaleDevicesOffline(): Promise<void> {
  const recent = await getRecentTelemetry();
  const devices = await Device.find().lean();
  const staleDeviceIds = devices.filter((device) => !recent.has(device.id)).map((device) => device.id);

  if (staleDeviceIds.length > 0) {
    await Device.updateMany(
      { id: { $in: staleDeviceIds }, status: { $ne: 'OFFLINE' } },
      { $set: { status: 'OFFLINE' } },
    );
  }
}
