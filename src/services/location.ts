import * as Location from 'expo-location';

import type { ZoneId } from '@/domain/types';
import { nearestZone } from '@/domain/zones';

export type LocateResult =
  | { status: 'found'; zone: ZoneId }
  | { status: 'outside' }
  | { status: 'denied' }
  | { status: 'unavailable' };

const LAST_KNOWN_MAX_AGE_MS = 15 * 60 * 1000;

/** One-off lookup of the closest covered district. Location is never stored or sent anywhere. */
export async function locateNearestZone(): Promise<LocateResult> {
  try {
    // Throws when location services are off or the browser has no geolocation.
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { status: 'denied' };

    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const match = nearestZone(position.coords);
    return match ? { status: 'found', zone: match.zone } : { status: 'outside' };
  } catch {
    return { status: 'unavailable' };
  }
}
