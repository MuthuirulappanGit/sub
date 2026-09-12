import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './connection.js';
import { User } from './schema.js';
import { Building, Room, Device, Relay } from './schema.js';
import { env } from '../config/env.js';

/**
 * Creates only an administrator account. Rooms, devices, telemetry, alerts,
 * and analytics must be created from real application events or ESP32 data.
 */
export async function seedDatabase() {
  await connectDB();
  await User.findOneAndUpdate(
    { email: 'admin@wattwise.io' },
    {
      id: 'usr_admin',
      name: 'Admin',
      email: 'admin@wattwise.io',
      password_hash: bcrypt.hashSync('Admin@123', 10),
      role: 'SUPER_ADMIN',
      building_id: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (env.NODE_ENV === 'test') {
    await Building.findOneAndUpdate({ id: 'bldg_sci' }, {
      id: 'bldg_sci', name: 'Test Facility', code: 'TEST', address: 'Test', total_floors: 1, area_sqft: 1, target_power_budget_kw: 1,
    }, { upsert: true });
    await Room.findOneAndUpdate({ id: 'room_sci_302' }, {
      id: 'room_sci_302', building_id: 'bldg_sci', name: 'Test Room', room_number: '302', floor_number: 1,
      room_type: 'LABORATORY', area_sqft: 1, power_threshold_watts: 100, is_occupied: false, current_power_w: 0,
    }, { upsert: true });
    await Device.findOneAndUpdate({ id: 'dev_esp32_302' }, {
      id: 'dev_esp32_302', room_id: 'room_sci_302', name: 'Test ESP32', device_token: 'esp32_token_sci_302',
      mac_address: '24:0A:C4:00:01:02', status: 'OFFLINE',
    }, { upsert: true });
    await Device.findOneAndUpdate({ id: 'dev_esp32_301' }, {
      id: 'dev_esp32_301', room_id: 'room_sci_302', name: 'Test ESP32 301', device_token: 'esp32_token_sci_301',
      mac_address: '24:0A:C4:00:01:01', status: 'OFFLINE',
    }, { upsert: true });
    await Relay.findOneAndUpdate({ id: 'relay_302_light' }, {
      id: 'relay_302_light', device_id: 'dev_esp32_302', name: 'Test Lighting', relay_index: 0, is_on: true,
      load_type: 'LIGHTING', auto_cutoff_enabled: true,
    }, { upsert: true });
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().then(() => disconnectDB());
}
