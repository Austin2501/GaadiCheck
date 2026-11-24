import { matchRule } from './rulesEngine';
import type { GrapRule, IsoDate, Vehicle } from './types';

/** Every subscriber receives stage changes for the whole region. */
export const REGION_TOPIC = 'ncr-all';

export function zoneTopic(vehicle: Vehicle): string {
  return `zone-${vehicle.homeZone}`;
}

/**
 * Topics a vehicle should follow: the region, its home district, and every rule that could
 * restrict it once the rule's stage is reached. Rules that have already lapsed are skipped.
 */
export function alertTopicsForVehicle(
  vehicle: Vehicle,
  rules: GrapRule[],
  today: IsoDate,
): string[] {
  const topics = new Set<string>([REGION_TOPIC, zoneTopic(vehicle)]);
  for (const rule of rules) {
    if (!rule.alertTopic) continue;
    if (rule.conditions.validUntil && today > rule.conditions.validUntil) continue;
    if (matchRule(rule, vehicle, { stage: 'any', today: 'any' }) !== 'no') {
      topics.add(rule.alertTopic);
    }
  }
  return [...topics].sort();
}

export function alertTopicsForGarage(
  vehicles: Vehicle[],
  rules: GrapRule[],
  today: IsoDate,
): string[] {
  const topics = new Set<string>();
  for (const vehicle of vehicles) {
    for (const topic of alertTopicsForVehicle(vehicle, rules, today)) topics.add(topic);
  }
  return [...topics].sort();
}
