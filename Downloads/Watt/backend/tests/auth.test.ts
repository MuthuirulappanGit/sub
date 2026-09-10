import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connection.js';
import { seedDatabase } from '../src/db/seed.js';

describe('WattWise Auth API', () => {
  beforeAll(async () => {
    await connectDB();
    await seedDatabase();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should authenticate user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/login')
      .send({
        email: 'admin@wattwise.io',
        password: 'Admin@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/login')
      .send({
        email: 'admin@wattwise.io',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
