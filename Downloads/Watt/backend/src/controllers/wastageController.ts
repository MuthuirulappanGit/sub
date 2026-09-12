import { Request, Response } from 'express';
import { WastageAlert, Room, Device, AuditLog } from '../db/schema.js';
import { getRecentTelemetry } from '../services/telemetryStatus.js';

export async function getWastageAlerts(req: Request, res: Response) {
  const { status, severity } = req.query;
  const filter: any = {};

  if (status) filter.status = String(status);
  if (severity) filter.severity = String(severity);

  const alerts = await WastageAlert.find(filter).sort({ created_at: -1 }).lean();
  const rooms = await Room.find().lean();
  const devices = await Device.find().lean();
  const enriched = alerts.map((a) => {
    const room = rooms.find((r) => r.id === a.room_id);
    const device = devices.find((d) => d.id === a.device_id);

    return {
      ...a,
      room_name: room ? room.name : 'Unknown Room',
      room_type: room ? room.room_type : 'LABORATORY',
      device_name: device ? device.name : 'Unknown ESP32',
    };
  });

  return res.json({ success: true, data: enriched });
}

export async function getWastageStats(req: Request, res: Response) {
  const activeAlerts = await WastageAlert.find({ status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } }).lean();
  const allAlerts = await WastageAlert.find().lean();
  const recentDeviceIds = new Set((await getRecentTelemetry()).keys());
  const validActiveAlerts = activeAlerts.filter((alert) => recentDeviceIds.has(alert.device_id));
  const validAlerts = allAlerts.filter((alert) => recentDeviceIds.has(alert.device_id));

  const totalCostWasted = validAlerts.reduce((sum, a) => sum + a.estimated_cost, 0);
  const totalKwhWasted = validAlerts.reduce((sum, a) => sum + a.wasted_kwh, 0);
  const totalCo2KgWasted = validAlerts.reduce((sum, a) => sum + a.estimated_co2_kg, 0);

  const criticalCount = validActiveAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = validActiveAlerts.filter((a) => a.severity === 'HIGH').length;

  return res.json({
    success: true,
    stats: {
      active_alerts_count: validActiveAlerts.length,
      critical_alerts_count: criticalCount,
      high_alerts_count: highCount,
      total_cost_wasted: parseFloat(totalCostWasted.toFixed(2)),
      total_kwh_wasted: parseFloat(totalKwhWasted.toFixed(2)),
      total_co2_kg_wasted: parseFloat(totalCo2KgWasted.toFixed(2)),
    },
  });
}

export async function acknowledgeAlert(req: Request, res: Response) {
  const { id } = req.params;
  const alert = await WastageAlert.findOne({ id });

  if (!alert) {
    return res.status(404).json({ success: false, message: 'Wastage alert not found' });
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledged_by = req.user?.id || 'SYSTEM';
  await alert.save();

  if (req.user) {
    await AuditLog.create({
      user_id: req.user.id,
      action: 'ALERT_ACKNOWLEDGE',
      details: `Alert "${alert.title}" (${alert.id}) acknowledged by ${req.user.email}`,
      timestamp: new Date(),
    });
  }

  return res.json({ success: true, message: 'Alert acknowledged successfully', data: alert });
}

export async function resolveAlert(req: Request, res: Response) {
  const { id } = req.params;
  const alert = await WastageAlert.findOne({ id });

  if (!alert) {
    return res.status(404).json({ success: false, message: 'Wastage alert not found' });
  }

  alert.status = 'RESOLVED';
  alert.resolved_at = new Date();
  alert.resolved_by = req.user?.id || 'SYSTEM';
  await alert.save();

  if (req.user) {
    await AuditLog.create({
      user_id: req.user.id,
      action: 'ALERT_RESOLVE',
      details: `Alert "${alert.title}" (${alert.id}) resolved by ${req.user.email}`,
      timestamp: new Date(),
    });
  }

  return res.json({ success: true, message: 'Alert resolved successfully', data: alert });
}
