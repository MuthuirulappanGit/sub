import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';

describe('ESP32 Telemetry Ingestion API', () => {
  beforeAll(async () => {
    await connectDB();
    await seedDatabase();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should accept valid ESP32 telemetry payload with valid X-ESP32-Key header', async () => {
    const res = await request(app)
      .post('/api/v1/telemetry/ingest')
      .set('X-ESP32-Key', 'esp32_secret_telemetry_key_wattwise_2026')
      .send({
        deviceToken: 'esp32_token_sci_301',
        voltage: 120.5,
        current: 5.2,
        power: 626.4,
        energyKwh: 15.4,
        occupancy: false,
        temperature: 23.1,
        humidity: 44.2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.processed.deviceId).toBe('dev_esp32_301');
  });

  it('should reject telemetry ingestion with missing or invalid API key', async () => {
    const res = await request(app)
      .post('/api/v1/telemetry/ingest')
      .set('X-ESP32-Key', 'invalid_key')
      .send({
        deviceToken: 'esp32_token_sci_301',
        voltage: 120.0,
        current: 1.0,
        power: 120.0,
        energyKwh: 1.0,
        occupancy: false,
      });

    expect(res.status).toBe(401);
  });
});
