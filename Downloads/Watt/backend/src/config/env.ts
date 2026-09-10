import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('wattwise_jwt_secret_super_secure_key_2026_prod!'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/wattwise'),
  ESP32_API_KEY: z.string().default('esp32_secret_telemetry_key_wattwise_2026'),
  COST_PER_KWH: z.string().default('8').transform((val) => parseFloat(val)),
  CO2_PER_KWH: z.string().default('0.85').transform((val) => parseFloat(val)),
  TELEMETRY_TIMEOUT_SECONDS: z.string().default('30').transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);
