export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FACILITY_MANAGER' | 'BUILDING_ADMIN' | 'AUDITOR';
  building_id?: string | null;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  total_floors: number;
  area_sqft: number;
  target_power_budget_kw: number;
  room_count?: number;
  occupied_room_count?: number;
  current_power_kw?: number;
  active_alerts_count?: number;
}

export interface Room {
  id: string;
  building_id: string;
  name: string;
  room_number: string;
  floor_number: number;
  room_type: 'CLASSROOM' | 'LABORATORY' | 'COMPUTER_LAB' | 'SERVER_ROOM' | 'FACULTY_OFFICE' | 'CONFERENCE_ROOM' | 'CAFETERIA';
  area_sqft: number;
  power_threshold_watts: number;
  is_occupied: boolean;
  has_telemetry?: boolean;
  current_power_w: number;
  devices?: Device[];
  relays?: Relay[];
  active_alert?: WastageAlert | null;
}

export interface Device {
  id: string;
  room_id: string;
  name: string;
  device_token: string;
  mac_address: string;
  firmware_version: string;
  ip_address: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  last_seen_at: string;
  relays?: Relay[];
  room_name?: string;
}

export interface Relay {
  id: string;
  device_id: string;
  name: string;
  relay_index: number;
  is_on: boolean;
  load_type: 'LIGHTING' | 'HVAC' | 'EQUIPMENT' | 'PLUG';
  auto_cutoff_enabled: boolean;
}

export interface WastageAlert {
  id: string;
  room_id: string;
  device_id: string;
  title: string;
  description: string;
  rule_triggered: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
  power_w: number;
  wasted_kwh: number;
  estimated_cost: number;
  estimated_co2_kg: number;
  acknowledged_by?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
  room_name?: string;
  room_type?: string;
  device_name?: string;
}

export interface Recommendation {
  id: string;
  building_id: string;
  room_id?: string;
  title: string;
  category: 'HVAC_OPTIMIZATION' | 'LIGHTING_AUTOMATION' | 'STANDBY_LOAD' | 'SCHEDULE_ALIGNMENT';
  description: string;
  potential_savings_kwh_monthly: number;
  potential_savings_usd_monthly: number;
  co2_reduction_kg_monthly: number;
  implementation_cost: number;
  payback_months: number;
  status: 'PROPOSED' | 'ACCEPTED' | 'IMPLEMENTED' | 'DISMISSED';
  building_name?: string;
  room_name?: string;
}

export interface TelemetryPoint {
  timestamp: string;
  timeLabel: string;
  power_kw: number;
  power_watts: number;
  is_occupied: boolean;
}
