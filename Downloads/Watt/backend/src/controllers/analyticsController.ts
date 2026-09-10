import { Request, Response } from 'express';
import { Building, Room, Device, TelemetryLog, Recommendation } from '../db/schema.js';
import { env } from '../config/env.js';
import { getRecentTelemetry } from '../services/telemetryStatus.js';

export async function getAnalyticsSummary(req: Request, res: Response) {
  const buildings = await Building.find().lean();
  const rooms = await Room.find().lean();
  const devices = await Device.find().lean();
  const last24h = new Date(Date.now() - 24 * 3600 * 1000);
  const recentTelemetry = await getRecentTelemetry();

  const euiBenchmarks = await Promise.all(
    buildings.map(async (bldg: any) => {
      const bldgRooms = rooms.filter((r: any) => r.building_id === bldg.id);
      const roomIds = bldgRooms.map((r: any) => r.id);

      const logs = await TelemetryLog.find({
        room_id: { $in: roomIds },
        timestamp: { $gte: last24h },
      }).lean();

      const totalPowerWattsSum = logs.reduce((sum, l: any) => sum + l.power_watts, 0);
      const avgWatts = logs.length ? totalPowerWattsSum / logs.length : 0;
      const dailyKwh = (avgWatts / 1000) * 24;
      const annualKwhEstimate = dailyKwh * 365;

      const euiKwhPerSqft = parseFloat((annualKwhEstimate / bldg.area_sqft).toFixed(2));

      return {
        building_id: bldg.id,
        building_name: bldg.name,
        code: bldg.code,
        area_sqft: bldg.area_sqft,
        daily_kwh: Math.round(dailyKwh),
        annual_kwh_estimate: Math.round(annualKwhEstimate),
        eui_kwh_per_sqft: euiKwhPerSqft,
        target_budget_kw: bldg.target_power_budget_kw,
      };
    })
  );

  const roomTypeDistribution: { [type: string]: number } = {};
  rooms.forEach((r: any) => {
    const device = devices.find((candidate) => candidate.room_id === r.id);
    const livePower = device ? recentTelemetry.get(device.id)?.power_watts ?? 0 : 0;
    roomTypeDistribution[r.room_type] = (roomTypeDistribution[r.room_type] || 0) + livePower;
  });

  const categoryBreakdown = Object.entries(roomTypeDistribution).map(([type, totalW]) => ({
    room_type: type,
    power_kw: parseFloat((totalW / 1000).toFixed(2)),
  }));

  return res.json({
    success: true,
    data: {
      eui_benchmarks: euiBenchmarks,
      category_breakdown: categoryBreakdown,
      rates: {
        cost_per_kwh: env.COST_PER_KWH,
        co2_kg_per_kwh: env.CO2_PER_KWH,
      },
    },
  });
}

export async function getRecommendations(req: Request, res: Response) {
  const recommendations = await Recommendation.find().sort({ created_at: -1 }).lean();
  const buildings = await Building.find().lean();
  const rooms = await Room.find().lean();

  const enriched = recommendations.map((r: any) => {
    const bldg = buildings.find((b: any) => b.id === r.building_id);
    const room = rooms.find((rm: any) => rm.id === r.room_id);

    return {
      ...r,
      building_name: bldg ? bldg.name : 'All Campus',
      room_name: room ? room.name : 'Facility Wide',
    };
  });

  const totalMonthlySavingsUSD = enriched
    .filter((r: any) => r.status !== 'DISMISSED')
    .reduce((sum: number, r: any) => sum + r.potential_savings_usd_monthly, 0);

  const totalMonthlyCo2Kg = enriched
    .filter((r: any) => r.status !== 'DISMISSED')
    .reduce((sum: number, r: any) => sum + r.co2_reduction_kg_monthly, 0);

  return res.json({
    success: true,
    summary: {
      total_recommendations: enriched.length,
      potential_monthly_savings_usd: Math.round(totalMonthlySavingsUSD),
      potential_monthly_co2_kg: Math.round(totalMonthlyCo2Kg),
    },
    data: enriched,
  });
}

export async function updateRecommendationStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  const rec = await Recommendation.findOne({ id });
  if (!rec) {
    return res.status(404).json({ success: false, message: 'Recommendation not found' });
  }

  rec.status = status;
  await rec.save();

  return res.json({ success: true, message: `Recommendation status updated to ${status}`, data: rec });
}
