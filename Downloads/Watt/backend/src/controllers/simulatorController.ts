import { Request, Response } from 'express';
import { z } from 'zod';
import { startIotSimulator, stopIotSimulator, getSimulatorStatus, isSimulatorEnabled } from '../services/iotSimulator.js';
import { Room, Device } from '../db/schema.js';
import { processTelemetryAndDetectWastage } from '../services/wastageEngine.js';

export const triggerSpikeSchema = z.object({
  roomId: z.string(),
  powerWatts: z.number().positive(),
  occupancy: z.boolean(),
});

export async function getStatus(req: Request, res: Response) {
  return res.json({ success: true, ...getSimulatorStatus() });
}

export async function startSimulator(req: Request, res: Response) {
  const { intervalMs = 5000 } = req.body;
  startIotSimulator(intervalMs);
  return res.json({ success: true, message: 'IoT Simulator started', ...getSimulatorStatus() });
}

export async function stopSimulator(req: Request, res: Response) {
  stopIotSimulator();
  return res.json({ success: true, message: 'IoT Simulator stopped', ...getSimulatorStatus() });
}

export async function triggerSpike(req: Request, res: Response) {
  if (!isSimulatorEnabled()) {
    return res.status(409).json({ success: false, message: 'Enable the IoT simulator before injecting telemetry.' });
  }

  const { roomId, powerWatts, occupancy } = req.body;

  const room = await Room.findOne({ id: roomId });
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const device = await Device.findOne({ room_id: roomId });
  if (!device) {
    return res.status(404).json({ success: false, message: 'No ESP32 device configured for this room' });
  }

  const voltage = 120.0;
  const current = parseFloat((powerWatts / voltage).toFixed(2));

  await processTelemetryAndDetectWastage({
    deviceId: device.id,
    roomId,
    powerWatts,
    occupancy,
    voltage,
    current,
    energyKwh: (powerWatts / 1000) * 0.1,
    powerFactor: 0.95,
    timestamp: new Date(),
  });

  return res.json({
    success: true,
    message: `Injected telemetry spike into ${room.name}: ${powerWatts}W (Occupancy: ${occupancy})`,
  });
}
