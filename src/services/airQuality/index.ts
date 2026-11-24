import { env } from '@/config/env';
import type { ZoneId } from '@/domain/types';
import { getZone } from '@/domain/zones';

import { fetchCpcbAirQuality } from './cpcb';
import { fetchModelledAirQuality } from './openMeteo';
import type { ZoneAirQuality } from './types';

export type { AqiReading, AqiSource, ZoneAirQuality } from './types';

/**
 * Official CPCB readings when a data.gov.in key is configured, otherwise the modelled estimate.
 * Tomorrow's outlook always comes from the forecast model.
 */
export async function getZoneAirQuality(
  zoneId: ZoneId,
  signal?: AbortSignal,
): Promise<ZoneAirQuality> {
  const zone = getZone(zoneId);
  const now = new Date();

  const [modelled, official] = await Promise.allSettled([
    fetchModelledAirQuality(zone, now, signal),
    env.dataGovApiKey
      ? fetchCpcbAirQuality(zone, env.dataGovApiKey, signal)
      : Promise.resolve(null),
  ]);

  const model = modelled.status === 'fulfilled' ? modelled.value : null;
  const cpcb = official.status === 'fulfilled' ? official.value : null;

  if (!model && !cpcb) {
    throw modelled.status === 'rejected' ? modelled.reason : new Error('Air quality unavailable');
  }

  return {
    zone: zoneId,
    current: cpcb ?? model?.current ?? null,
    tomorrow: model?.tomorrow ?? null,
  };
}
