import { Device, Room } from '../db/schema.js';
import { processTelemetryAndDetectWastage } from './wastageEngine.js';

let simulatorTimer: NodeJS.Timeout | null = null;
let isSimulatorRunning = false;

export function startIotSimulator(intervalMs = 5000) {
  if (isSimulatorRunning) return;
  isSimulatorRunning = true;

  console.log(`📡 [IoT SIMULATOR] Started sending live multi-room telemetry every ${intervalMs / 1000}s...`);

  simulatorTimer = setInterval(async () => {
    try {
      const devices = await Device.find().lean();
      if (!devices.length) return;

      for (const dev of devices) {
        const room = await Room.findOne({ id: dev.room_id });
        if (!room) continue;

        // Determine live fluctuations
        let occupancy = room.is_occupied;
        let powerW = room.current_power_w;

        // Occasional random state transitions for demo richness
        if (Math.random() < 0.15) {
          // 15% chance to toggle occupancy or spike load
          if (dev.id === 'dev_esp32_301') {
            // Physics lab
            occupancy = Math.random() > 0.5;
            powerW = occupancy ? 820 + Math.random() * 100 : 640 + Math.random() * 50;
          } else if (dev.id === 'dev_esp32_201') {
            // CS Lab
            powerW = 1200 + Math.random() * 200;
          } else if (dev.id !== 'dev_esp32_001') {
            occupancy = Math.random() > 0.6;
            powerW = occupancy ? room.power_threshold_watts * 2.5 + Math.random() * 50 : Math.random() * 30;
          }
        } else {
          // Small noise fluctuation around current power
          const noise = (Math.random() - 0.5) * 10;
          powerW = Math.max(10, powerW + noise);
        }

        const voltage = 120.0 + (Math.random() - 0.5) * 2;
        const current = parseFloat((powerW / voltage).toFixed(2));
        const cumulativeKwh = (powerW / 1000) * (intervalMs / 3600000);

        await processTelemetryAndDetectWastage({
          deviceId: dev.id,
          roomId: room.id,
          powerWatts: parseFloat(powerW.toFixed(1)),
          occupancy,
          voltage: parseFloat(voltage.toFixed(1)),
          current,
          energyKwh: parseFloat(cumulativeKwh.toFixed(4)),
          powerFactor: 0.95,
          temperature: parseFloat((22 + (Math.random() - 0.5)).toFixed(1)),
          humidity: parseFloat((45 + (Math.random() - 0.5)).toFixed(1)),
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error('❌ [IoT SIMULATOR] Error during simulation loop:', err);
    }
  }, intervalMs);
}

export function stopIotSimulator() {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
  }
  isSimulatorRunning = false;
  console.log('🛑 [IoT SIMULATOR] Stopped background simulator worker.');
}

export function getSimulatorStatus() {
  return { isRunning: isSimulatorRunning };
}

export function isSimulatorEnabled() {
  return isSimulatorRunning;
}
