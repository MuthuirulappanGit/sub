# WattWise ⚡

> **IoT Energy Monitoring & Unoccupied Wastage Conservation Platform** for Schools, Research Labs, Offices & Commercial Buildings.

WattWise enables real-time telemetry processing from ESP32 microcontrollers, automatic detection of unoccupied room energy wastage, remote smart relay actuation, and AI/rule-based energy conservation analytics.

---

## 🚀 Features

- **Live IoT Telemetry**: Process voltage, current, active power (W), energy (kWh), power factor, PIR occupancy, and ambient temperature/humidity.
- **Automated Unoccupied Wastage Engine**: Instantly flags instances where unoccupied rooms consume active electrical load above threshold, estimating wasted kWh, financial cost, and carbon emissions ($/hr, kg CO2e).
- **Remote Relay Control**: Manually or automatically actuate smart relays connected to lighting circuits, HVAC, or equipment plugs.
- **Analytics & EUI Benchmarking**: Calculate Energy Use Intensity ($kWh/ft^2$), load duration curves, peak-to-off-peak ratios, and building comparisons.
- **Conservation Recommendations**: Automated AI recommendations with projected monthly ROI ($) and payback period.
- **Built-in ESP32 Telemetry Simulator**: Interactively test multi-room load patterns, simulate unoccupied high-power events, and trigger automated alerts in real-time.
- **JWT & HTTP-Only Cookies**: Secure authentication with role-based access control (`SUPER_ADMIN`, `FACILITY_MANAGER`, `BUILDING_ADMIN`, `AUDITOR`).

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router v6, Recharts, Lucide Icons, Tailwind CSS
- **Backend**: Express.js, TypeScript, SQLite (`better-sqlite3` in WAL mode), Zod, JWT, bcryptjs, Helmet, CORS, Express Rate Limit
- **Testing**: Vitest test runner

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run Development Servers
```bash
npm run dev
```
- Frontend will open at: `http://localhost:3000`
- Backend API runs at: `http://localhost:5000`

### 🔑 Demo Login Credentials
- **Email**: `admin@wattwise.io`
- **Password**: `Admin@123`

---

## ☁️ Vercel Deployment

WattWise includes a root `vercel.json` and serverless API adapter for one-project deployment:

1. Import the repository into Vercel.
2. Keep the project root at the repository root; do not set `frontend` as the root directory.
3. Add `MONGODB_URI`, `JWT_SECRET`, and `ESP32_API_KEY` as production environment variables.
4. Deploy. Vercel builds `dist/frontend` and routes `/api/*` to the backend function.

The database must be a persistent MongoDB deployment in production. Do not rely on the in-memory fallback for deployed data.

---

## 🔌 ESP32 Telemetry Payload Specification

ESP32 microcontrollers send periodic POST requests to `/api/v1/telemetry/ingest`:

```json
{
  "deviceToken": "esp32_sci_301",
  "voltage": 120.4,
  "current": 4.15,
  "power": 498.0,
  "energyKwh": 12.45,
  "powerFactor": 0.95,
  "occupancy": false,
  "temperature": 22.5,
  "humidity": 45.0,
  "timestamp": "2026-09-08T21:00:00.000Z"
}
```
Header: `X-ESP32-Key: esp32_secret_telemetry_key_wattwise_2026`
