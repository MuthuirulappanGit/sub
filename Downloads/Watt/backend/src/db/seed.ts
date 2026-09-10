import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './connection.js';
import { Building, Room, Device, Relay, User, TelemetryLog, WastageAlert, Recommendation, AuditLog } from './schema.js';

export async function seedDatabase() {
  console.log('⚡ Connecting to MongoDB for Database Seeding...');
  await connectDB();

  console.log('🌱 Clearing existing collections...');
  await Promise.all([
    Building.deleteMany({}),
    Room.deleteMany({}),
    Device.deleteMany({}),
    Relay.deleteMany({}),
    User.deleteMany({}),
    TelemetryLog.deleteMany({}),
    WastageAlert.deleteMany({}),
    Recommendation.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // 1. Insert Buildings
  console.log('  Seeding Campus Buildings...');
  const buildings = [
    {
      id: 'bldg_sci',
      name: 'Science & Technology Complex',
      code: 'SCI-HALL',
      address: '100 University Ave, Campus West',
      total_floors: 4,
      area_sqft: 45000,
      target_power_budget_kw: 120.0,
    },
    {
      id: 'bldg_eng',
      name: 'Engineering Research Tower',
      code: 'ENG-TWR',
      address: '104 University Ave, Campus East',
      total_floors: 6,
      area_sqft: 60000,
      target_power_budget_kw: 150.0,
    },
    {
      id: 'bldg_inn',
      name: 'Innovation & Student Center',
      code: 'INN-CTR',
      address: '200 Student Plaza',
      total_floors: 3,
      area_sqft: 30000,
      target_power_budget_kw: 80.0,
    },
  ];
  await Building.insertMany(buildings);

  // 2. Insert Rooms
  console.log('  Seeding Rooms & Laboratories...');
  const rooms = [
    {
      id: 'room_sci_301',
      building_id: 'bldg_sci',
      name: 'Physics Advanced Optics Lab',
      room_number: '301',
      floor_number: 3,
      room_type: 'LABORATORY',
      area_sqft: 1200,
      power_threshold_watts: 200.0,
      is_occupied: false,
      current_power_w: 0.0,
    },
    {
      id: 'room_sci_302',
      building_id: 'bldg_sci',
      name: 'Organic Chemistry Lab',
      room_number: '302',
      floor_number: 3,
      room_type: 'LABORATORY',
      area_sqft: 1000,
      power_threshold_watts: 180.0,
      is_occupied: false,
      current_power_w: 0.0,
    },
    {
      id: 'room_eng_201',
      building_id: 'bldg_eng',
      name: 'Computer Systems Lab A',
      room_number: '201',
      floor_number: 2,
      room_type: 'COMPUTER_LAB',
      area_sqft: 1500,
      power_threshold_watts: 300.0,
      is_occupied: false,
      current_power_w: 0.0,
    },
    {
      id: 'room_sci_101',
      building_id: 'bldg_sci',
      name: 'Grand Auditorium & Lecture Hall',
      room_number: '101',
      floor_number: 1,
      room_type: 'CLASSROOM',
      area_sqft: 2500,
      power_threshold_watts: 150.0,
      is_occupied: false,
      current_power_w: 0.0,
    },
    {
      id: 'room_eng_001',
      building_id: 'bldg_eng',
      name: 'Main Datacenter & Server Room',
      room_number: '001',
      floor_number: 0,
      room_type: 'SERVER_ROOM',
      area_sqft: 800,
      power_threshold_watts: 1500.0,
      is_occupied: false, // Servers running expected
      current_power_w: 0.0,
    },
    {
      id: 'room_inn_405',
      building_id: 'bldg_inn',
      name: 'Faculty Workspace 405',
      room_number: '405',
      floor_number: 4,
      room_type: 'FACULTY_OFFICE',
      area_sqft: 350,
      power_threshold_watts: 50.0,
      is_occupied: false,
      current_power_w: 0.0,
    },
  ];
  await Room.insertMany(rooms);

  // 3. Insert ESP32 Devices & Relays
  console.log('  Seeding ESP32 Microcontrollers & Smart Relays...');
  const devices = [
    {
      id: 'dev_esp32_301',
      room_id: 'room_sci_301',
      name: 'ESP32 Node - Physics 301',
      device_token: 'esp32_token_sci_301',
      mac_address: '24:0A:C4:00:01:01',
      firmware_version: 'v2.1.4',
      ip_address: '192.168.1.101',
      status: 'OFFLINE',
    },
    {
      id: 'dev_esp32_302',
      room_id: 'room_sci_302',
      name: 'ESP32 Node - Chem 302',
      device_token: 'esp32_token_sci_302',
      mac_address: '24:0A:C4:00:01:02',
      firmware_version: 'v2.1.4',
      ip_address: '192.168.1.102',
      status: 'OFFLINE',
    },
    {
      id: 'dev_esp32_201',
      room_id: 'room_eng_201',
      name: 'ESP32 Node - CS Lab 201',
      device_token: 'esp32_token_eng_201',
      mac_address: '24:0A:C4:00:02:01',
      firmware_version: 'v2.1.4',
      ip_address: '192.168.1.103',
      status: 'OFFLINE',
    },
    {
      id: 'dev_esp32_101',
      room_id: 'room_sci_101',
      name: 'ESP32 Node - Aud 101',
      device_token: 'esp32_token_sci_101',
      mac_address: '24:0A:C4:00:01:03',
      firmware_version: 'v2.1.4',
      ip_address: '192.168.1.104',
      status: 'OFFLINE',
    },
    {
      id: 'dev_esp32_001',
      room_id: 'room_eng_001',
      name: 'ESP32 Node - Datacenter',
      device_token: 'esp32_token_eng_001',
      mac_address: '24:0A:C4:00:02:02',
      firmware_version: 'v2.1.4',
      ip_address: '192.168.1.105',
      status: 'OFFLINE',
    },
    {
      id: 'dev_esp32_405',
      room_id: 'room_inn_405',
      name: 'ESP32 Node - Office 405',
      device_token: 'esp32_token_inn_405',
      mac_address: '24:0A:C4:00:03:01',
      firmware_version: 'v2.1.4',
      ip_address: '192.168.1.106',
      status: 'OFFLINE',
    },
  ];
  await Device.insertMany(devices);

  const relays = [
    { id: 'relay_301_light', device_id: 'dev_esp32_301', name: 'Main Lighting Circuit', relay_index: 0, is_on: true, load_type: 'LIGHTING', auto_cutoff_enabled: true },
    { id: 'relay_301_hvac', device_id: 'dev_esp32_301', name: 'HVAC Air Handler', relay_index: 1, is_on: true, load_type: 'HVAC', auto_cutoff_enabled: true },
    { id: 'relay_301_equip', device_id: 'dev_esp32_301', name: 'Laser Bench Power', relay_index: 2, is_on: true, load_type: 'EQUIPMENT', auto_cutoff_enabled: false },

    { id: 'relay_302_light', device_id: 'dev_esp32_302', name: 'Lab Lighting', relay_index: 0, is_on: true, load_type: 'LIGHTING', auto_cutoff_enabled: true },
    { id: 'relay_302_hood', device_id: 'dev_esp32_302', name: 'Fume Hood Exhaust', relay_index: 1, is_on: true, load_type: 'EQUIPMENT', auto_cutoff_enabled: false },

    { id: 'relay_201_workstations', device_id: 'dev_esp32_201', name: 'PC Workstation Bus', relay_index: 0, is_on: true, load_type: 'PLUG', auto_cutoff_enabled: true },
    { id: 'relay_201_ac', device_id: 'dev_esp32_201', name: 'Lab AC Unit', relay_index: 1, is_on: true, load_type: 'HVAC', auto_cutoff_enabled: true },

    { id: 'relay_405_ac', device_id: 'dev_esp32_405', name: 'Window AC Unit', relay_index: 0, is_on: true, load_type: 'HVAC', auto_cutoff_enabled: true },
  ];
  await Relay.insertMany(relays);

  // 4. Insert Administrative Accounts
  console.log('  Seeding Administrative User Accounts...');
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const managerPasswordHash = bcrypt.hashSync('Manager@123', 10);

  const users = [
    {
      id: 'usr_admin',
      name: 'Dr. Sarah Connor (Facility Director)',
      email: 'admin@wattwise.io',
      password_hash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      building_id: null,
    },
    {
      id: 'usr_manager',
      name: 'Alex Rivera (Science Hall Admin)',
      email: 'manager@wattwise.io',
      password_hash: managerPasswordHash,
      role: 'FACILITY_MANAGER',
      building_id: 'bldg_sci',
    },
    {
      id: 'usr_auditor',
      name: 'Elena Rostova (Sustainability Auditor)',
      email: 'auditor@wattwise.io',
      password_hash: managerPasswordHash,
      role: 'AUDITOR',
      building_id: null,
    },
  ];
  await User.insertMany(users);

  // 5. Insert Conservation Recommendations
  console.log('  Seeding Conservation Recommendations...');
  const recommendations = [
    {
      id: 'rec_hvac_sci',
      building_id: 'bldg_sci',
      room_id: 'room_sci_301',
      title: 'Auto-Cutoff HVAC & Optics Power in Lab 301 after 20m Inactivity',
      category: 'HVAC_OPTIMIZATION',
      description: 'Configure automated ESP32 relay interlock to set HVAC into eco mode and shut down non-essential benches when room remains unoccupied.',
      potential_savings_kwh_monthly: 420.0,
      potential_savings_usd_monthly: 63.0,
      co2_reduction_kg_monthly: 357.0,
      implementation_cost: 0.0,
      payback_months: 0.0,
      status: 'PROPOSED',
    },
    {
      id: 'rec_standby_cs',
      building_id: 'bldg_eng',
      room_id: 'room_eng_201',
      title: 'Smart Power Strip Interlock for CS Computer Lab Workstations',
      category: 'STANDBY_LOAD',
      description: 'Implement scheduled nightly power bus cut-off between 10 PM and 6 AM for 35 desktop workstations.',
      potential_savings_kwh_monthly: 900.0,
      potential_savings_usd_monthly: 135.0,
      co2_reduction_kg_monthly: 765.0,
      implementation_cost: 150.0,
      payback_months: 1.1,
      status: 'PROPOSED',
    },
    {
      id: 'rec_lighting_inn',
      building_id: 'bldg_inn',
      room_id: 'room_inn_405',
      title: 'Automate PIR Occupancy Lighting Shutoff in Faculty Offices',
      category: 'LIGHTING_AUTOMATION',
      description: 'Set lighting cutoff threshold from 45 minutes down to 10 minutes across all 4th floor offices.',
      potential_savings_kwh_monthly: 180.0,
      potential_savings_usd_monthly: 27.0,
      co2_reduction_kg_monthly: 153.0,
      implementation_cost: 0.0,
      payback_months: 0.0,
      status: 'ACCEPTED',
    },
  ];
  await Recommendation.insertMany(recommendations);

  console.log('✅ MongoDB Seed Completed Successfully!');
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().then(() => disconnectDB());
}
