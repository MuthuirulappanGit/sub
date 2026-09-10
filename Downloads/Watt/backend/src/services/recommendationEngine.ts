import { Recommendation, Room, Building, WastageAlert } from '../db/schema.js';
import { env } from '../config/env.js';

export async function generateEnergyRecommendations() {
  const buildings = await Building.find().lean();
  const rooms = await Room.find().lean();
  
  for (const bldg of buildings) {
    const bldgRooms = rooms.filter((r) => r.building_id === bldg.id);
    
    for (const rm of bldgRooms) {
      const recentAlertsCount = await WastageAlert.countDocuments({
        room_id: rm.id,
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      });

      if (recentAlertsCount >= 3) {
        const recId = `rec_auto_${rm.id}`;
        const existing = await Recommendation.findOne({ id: recId });

        if (!existing) {
          const potentialMonthlyKwh = rm.power_threshold_watts * 3 * 30; // 3 hours wastage per day over 30 days
          const potentialMonthlyUsd = potentialMonthlyKwh * env.COST_PER_KWH;
          const co2Kg = potentialMonthlyKwh * env.CO2_PER_KWH;

          await Recommendation.create({
            id: recId,
            building_id: bldg.id,
            room_id: rm.id,
            title: `Automate Load Interlock in ${rm.name}`,
            category: rm.room_type === 'LABORATORY' ? 'HVAC_OPTIMIZATION' : 'LIGHTING_AUTOMATION',
            description: `High frequency of unoccupied wastage detected in ${rm.name} (${recentAlertsCount} incidents this week). Enabling automated relay schedules can eliminate idle load.`,
            potential_savings_kwh_monthly: Math.round(potentialMonthlyKwh),
            potential_savings_usd_monthly: Math.round(potentialMonthlyUsd),
            co2_reduction_kg_monthly: Math.round(co2Kg),
            implementation_cost: 0,
            payback_months: 0,
            status: 'PROPOSED',
          });
        }
      }
    }
  }
}
