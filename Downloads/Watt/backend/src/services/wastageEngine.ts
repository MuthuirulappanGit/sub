import { Room, Device, Relay, WastageAlert, TelemetryLog, Setting } from '../db/schema.js';
import { env } from '../config/env.js';
import { randomUUID } from 'node:crypto';

export interface ProcessTelemetryInput {
  deviceId: string;
  roomId: string;
  powerWatts: number;
  occupancy: boolean;
  voltage: number;
  current: number;
  energyKwh: number;
  powerFactor?: number;
  temperature?: number;
  humidity?: number;
  sensorStatus?: { pir?: boolean; current?: boolean; electricity?: boolean };
  timestamp?: Date;
}

export async function processTelemetryAndDetectWastage(data: ProcessTelemetryInput) {
  const { deviceId, roomId, powerWatts, occupancy, voltage, current, energyKwh, powerFactor = 0.95, temperature = 22.0, humidity = 45.0, sensorStatus } = data;
  const now = data.timestamp || new Date();

  // 1. Update room status in database
  const room = await Room.findOne({ id: roomId });
  if (!room) return;

  room.current_power_w = powerWatts;
  room.is_occupied = occupancy;
  await room.save();

  // 2. Update device last seen & status
  const device = await Device.findOne({ id: deviceId });
  if (device) {
    device.last_seen_at = now;
    if (powerWatts > room.power_threshold_watts * 2 && !occupancy) {
      device.status = 'WARNING';
    } else {
      device.status = 'ONLINE';
    }
    await device.save();
  }

  // 3. Log Telemetry
  await TelemetryLog.create({
    device_id: deviceId,
    room_id: roomId,
    voltage,
    current,
    power_watts: powerWatts,
    energy_kwh: energyKwh,
    power_factor: powerFactor,
    occupancy,
    temperature,
    humidity,
    sensor_status: sensorStatus,
    timestamp: now,
  });

  // 4. Wastage Detection Rules Engine
  const isUnoccupied = !occupancy;
  const exceedsThreshold = powerWatts > room.power_threshold_watts;

  if (isUnoccupied && exceedsThreshold) {
    // Check if an ACTIVE alert already exists for this room
    let existingAlert = await WastageAlert.findOne({
      room_id: roomId,
      status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] },
    });

    // Calculate metrics
    const wastedKwhIncrement = (powerWatts / 1000) * (5 / 60); // 5-minute window estimate
    const tariffSetting = await Setting.findOne({ key: 'tariffPerKwh' }).select('value').lean();
    const tariff = tariffSetting && !Array.isArray(tariffSetting) && 'value' in tariffSetting
      ? Number(tariffSetting.value)
      : env.COST_PER_KWH;
    const costIncrement = wastedKwhIncrement * tariff;
    const co2Increment = wastedKwhIncrement * env.CO2_PER_KWH;

    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (powerWatts > 1000) severity = 'CRITICAL';
    else if (powerWatts > 500) severity = 'HIGH';
    else if (powerWatts > 200) severity = 'MEDIUM';

    const durationSetting = await Setting.findOne({ key: 'wastageAlertDurationSeconds' }).select('value').lean();
    const requiredDurationSeconds = durationSetting && !Array.isArray(durationSetting) && 'value' in durationSetting
      ? Number(durationSetting.value)
      : env.WASTAGE_DURATION_SECONDS;

    if (existingAlert) {
      const elapsedSeconds = (now.getTime() - new Date(existingAlert.created_at).getTime()) / 1000;
      if (elapsedSeconds < requiredDurationSeconds) {
        return;
      }
      // Accumulate metrics
      existingAlert.power_w = powerWatts;
      existingAlert.wasted_kwh += wastedKwhIncrement;
      existingAlert.estimated_cost += costIncrement;
      existingAlert.estimated_co2_kg += co2Increment;
      existingAlert.severity = severity;
      await existingAlert.save();
    } else {
      // Create new Wastage Alert
      const alertId = `alert_${randomUUID()}`;
      await WastageAlert.create({
        id: alertId,
        room_id: roomId,
        device_id: deviceId,
        title: `Unoccupied Wastage in ${room.name}`,
        description: `Room is unoccupied but drawing ${powerWatts.toFixed(0)}W (Threshold: ${room.power_threshold_watts}W).`,
        rule_triggered: 'UNOCCUPIED_ACTIVE_LOAD',
        severity,
        status: 'ACTIVE',
        power_w: powerWatts,
        wasted_kwh: parseFloat(wastedKwhIncrement.toFixed(3)),
        estimated_cost: parseFloat(costIncrement.toFixed(2)),
        estimated_co2_kg: parseFloat(co2Increment.toFixed(2)),
        created_at: now,
      });

      // Check auto-cutoff relays if CRITICAL or HIGH
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        const autoCutoffRelays = await Relay.find({
          device_id: deviceId,
          auto_cutoff_enabled: true,
          is_on: true,
        });

        for (const relay of autoCutoffRelays) {
          // Trigger auto cutoff
          relay.is_on = false;
          await relay.save();
          console.log(`🔌 [AUTO-CUTOFF] Relay "${relay.name}" (${relay.id}) turned OFF due to ${severity} wastage alert.`);
        }
      }
    }
  } else {
    // If room is now occupied or power dropped below threshold, auto-resolve any ACTIVE alert
    const activeAlert = await WastageAlert.findOne({
      room_id: roomId,
      status: 'ACTIVE',
    });

    if (activeAlert) {
      activeAlert.status = 'RESOLVED';
      activeAlert.resolved_at = now;
      activeAlert.resolved_by = 'SYSTEM_AUTO_RESOLVE';
      await activeAlert.save();
    }
  }
}
