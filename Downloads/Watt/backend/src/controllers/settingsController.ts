import { Request, Response } from 'express';
import { z } from 'zod';
import { Setting } from '../db/schema.js';
import { env } from '../config/env.js';

export const updateSettingsSchema = z.object({
  tariffPerKwh: z.number().positive().max(100000),
  telemetryTimeoutSeconds: z.number().int().positive().max(86400),
  activeCurrentThreshold: z.number().positive().max(100000),
  wastageAlertDurationSeconds: z.number().int().positive().max(86400),
});

export async function getSettings(_req: Request, res: Response) {
  const stored = await Setting.find({ key: { $in: ['tariffPerKwh', 'telemetryTimeoutSeconds', 'activeCurrentThreshold', 'wastageAlertDurationSeconds'] } }).lean();
  const values = new Map(stored.map((setting) => [setting.key, setting.value]));
  return res.json({
    success: true,
    data: {
      tariffPerKwh: values.get('tariffPerKwh') ?? env.COST_PER_KWH,
      telemetryTimeoutSeconds: values.get('telemetryTimeoutSeconds') ?? env.TELEMETRY_TIMEOUT_SECONDS,
      activeCurrentThreshold: values.get('activeCurrentThreshold') ?? 100,
      wastageAlertDurationSeconds: values.get('wastageAlertDurationSeconds') ?? env.WASTAGE_DURATION_SECONDS,
    },
  });
}

export async function updateSettings(req: Request, res: Response) {
  const parsed = updateSettingsSchema.parse(req.body);
  await Promise.all(
    Object.entries(parsed).map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { value, updated_at: new Date() }, { upsert: true, new: true }),
    ),
  );
  return res.json({ success: true, data: parsed });
}
