import mongoose, { Schema } from 'mongoose';

// Building Schema
const buildingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  total_floors: { type: Number, required: true, default: 1 },
  area_sqft: { type: Number, required: true, default: 10000 },
  target_power_budget_kw: { type: Number, required: true, default: 50.0 },
  created_at: { type: Date, default: Date.now }
});

// Room Schema
const roomSchema = new Schema({
  id: { type: String, required: true, unique: true },
  building_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  room_number: { type: String, required: true },
  floor_number: { type: Number, required: true, default: 1 },
  room_type: { 
    type: String, 
    enum: ['CLASSROOM', 'LABORATORY', 'COMPUTER_LAB', 'SERVER_ROOM', 'FACULTY_OFFICE', 'CONFERENCE_ROOM', 'CAFETERIA'],
    required: true 
  },
  area_sqft: { type: Number, required: true, default: 500 },
  power_threshold_watts: { type: Number, required: true, default: 50.0 },
  is_occupied: { type: Boolean, required: true, default: false },
  current_power_w: { type: Number, required: true, default: 0.0 },
  created_at: { type: Date, default: Date.now }
});

// Device Schema
const deviceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  room_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  device_token: { type: String, required: true, unique: true },
  mac_address: { type: String, required: true, unique: true },
  firmware_version: { type: String, default: 'v1.0.0' },
  ip_address: { type: String, default: '192.168.1.100' },
  status: { type: String, enum: ['ONLINE', 'OFFLINE', 'WARNING'], default: 'OFFLINE' },
  last_seen_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

// Relay Schema
const relaySchema = new Schema({
  id: { type: String, required: true, unique: true },
  device_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  relay_index: { type: Number, required: true, default: 0 },
  is_on: { type: Boolean, required: true, default: true },
  load_type: { type: String, enum: ['LIGHTING', 'HVAC', 'EQUIPMENT', 'PLUG'], default: 'LIGHTING' },
  auto_cutoff_enabled: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'FACILITY_MANAGER', 'BUILDING_ADMIN', 'AUDITOR'], 
    required: true 
  },
  building_id: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

// Telemetry Log Schema
const telemetryLogSchema = new Schema({
  device_id: { type: String, required: true, index: true },
  room_id: { type: String, required: true, index: true },
  voltage: { type: Number, required: true },
  current: { type: Number, required: true },
  power_watts: { type: Number, required: true },
  energy_kwh: { type: Number, required: true },
  power_factor: { type: Number, default: 0.95 },
  occupancy: { type: Boolean, required: true, default: false },
  temperature: { type: Number, default: 22.0 },
  humidity: { type: Number, default: 45.0 },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Wastage Alert Schema
const wastageAlertSchema = new Schema({
  id: { type: String, required: true, unique: true },
  room_id: { type: String, required: true, index: true },
  device_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  rule_triggered: { type: String, required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  status: { type: String, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'], default: 'ACTIVE', index: true },
  power_w: { type: Number, required: true },
  wasted_kwh: { type: Number, default: 0.0 },
  estimated_cost: { type: Number, default: 0.0 },
  estimated_co2_kg: { type: Number, default: 0.0 },
  acknowledged_by: { type: String, default: null },
  resolved_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  resolved_at: { type: Date, default: null }
});

// Recommendation Schema
const recommendationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  building_id: { type: String, required: true, index: true },
  room_id: { type: String, default: null },
  title: { type: String, required: true },
  category: { type: String, enum: ['HVAC_OPTIMIZATION', 'LIGHTING_AUTOMATION', 'STANDBY_LOAD', 'SCHEDULE_ALIGNMENT'], required: true },
  description: { type: String, required: true },
  potential_savings_kwh_monthly: { type: Number, required: true },
  potential_savings_usd_monthly: { type: Number, required: true },
  co2_reduction_kg_monthly: { type: Number, required: true },
  implementation_cost: { type: Number, default: 0.0 },
  payback_months: { type: Number, default: 0.0 },
  status: { type: String, enum: ['PROPOSED', 'ACCEPTED', 'IMPLEMENTED', 'DISMISSED'], default: 'PROPOSED' },
  created_at: { type: Date, default: Date.now }
});

// Audit Log Schema
const auditLogSchema = new Schema({
  user_id: { type: String, default: null },
  action: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Building = mongoose.models.Building || mongoose.model('Building', buildingSchema);
export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);
export const Relay = mongoose.models.Relay || mongoose.model('Relay', relaySchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const TelemetryLog = mongoose.models.TelemetryLog || mongoose.model('TelemetryLog', telemetryLogSchema);
export const WastageAlert = mongoose.models.WastageAlert || mongoose.model('WastageAlert', wastageAlertSchema);
export const Recommendation = mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
