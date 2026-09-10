import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';
import { processTelemetryAndDetectWastage } from '../src/services/wastageEngine.js';
import { WastageAlert, Room, Relay } from '../src/db/schema.js';

describe('Wastage Engine & Auto-Cutoff Logic', () => {
  beforeAll(async () => {
    await connectDB();
    await seedDatabase();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should generate a CRITICAL wastage alert when an unoccupied room consumes high power', async () => {
    const room = await Room.findOne({ id: 'room_sci_302' });
    expect(room).toBeDefined();

    await processTelemetryAndDetectWastage({
      deviceId: 'dev_esp32_302',
      roomId: 'room_sci_302',
      powerWatts: 1400.0, // High power > 1000W
      occupancy: false,   // Unoccupied
      voltage: 120.0,
      current: 11.6,
      energyKwh: 5.2,
      timestamp: new Date(),
    });

    const alert = await WastageAlert.findOne({
      room_id: 'room_sci_302',
      status: 'ACTIVE',
    });

    expect(alert).toBeDefined();
    expect(alert?.severity).toBe('CRITICAL');
    expect(alert?.power_w).toBe(1400.0);

    // Verify auto-cutoff relays were actuated
    const relay = await Relay.findOne({ id: 'relay_302_light' });
    expect(relay?.is_on).toBe(false);
  });
});
