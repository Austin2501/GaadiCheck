import type { LocalizedText, ZoneId } from './types';

export interface CpcbLocation {
  /** State as expected by the data.gov.in filter (multi-word states use underscores). */
  state: string;
  city: string;
}

export interface Zone {
  id: ZoneId;
  name: LocalizedText;
  shortName: LocalizedText;
  centroid: { latitude: number; longitude: number };
  cpcb: CpcbLocation[];
}

export const ZONES: readonly Zone[] = [
  {
    id: 'delhi',
    name: { en: 'Delhi', hi: 'दिल्ली' },
    shortName: { en: 'Delhi', hi: 'दिल्ली' },
    centroid: { latitude: 28.6139, longitude: 77.209 },
    cpcb: [{ state: 'Delhi', city: 'Delhi' }],
  },
  {
    id: 'gurugram',
    name: { en: 'Gurugram', hi: 'गुरुग्राम' },
    shortName: { en: 'Gurugram', hi: 'गुरुग्राम' },
    centroid: { latitude: 28.4595, longitude: 77.0266 },
    cpcb: [{ state: 'Haryana', city: 'Gurugram' }],
  },
  {
    id: 'faridabad',
    name: { en: 'Faridabad', hi: 'फरीदाबाद' },
    shortName: { en: 'Faridabad', hi: 'फरीदाबाद' },
    centroid: { latitude: 28.4089, longitude: 77.3178 },
    cpcb: [{ state: 'Haryana', city: 'Faridabad' }],
  },
  {
    id: 'ghaziabad',
    name: { en: 'Ghaziabad', hi: 'गाज़ियाबाद' },
    shortName: { en: 'Ghaziabad', hi: 'गाज़ियाबाद' },
    centroid: { latitude: 28.6692, longitude: 77.4538 },
    cpcb: [{ state: 'Uttar_Pradesh', city: 'Ghaziabad' }],
  },
  {
    id: 'gautam-buddh-nagar',
    name: { en: 'Gautam Buddh Nagar (Noida)', hi: 'गौतम बुद्ध नगर (नोएडा)' },
    shortName: { en: 'Noida', hi: 'नोएडा' },
    centroid: { latitude: 28.5355, longitude: 77.391 },
    cpcb: [
      { state: 'Uttar_Pradesh', city: 'Noida' },
      { state: 'Uttar_Pradesh', city: 'Greater_Noida' },
    ],
  },
  {
    id: 'sonipat',
    name: { en: 'Sonipat', hi: 'सोनीपत' },
    shortName: { en: 'Sonipat', hi: 'सोनीपत' },
    centroid: { latitude: 28.9931, longitude: 77.0151 },
    cpcb: [{ state: 'Haryana', city: 'Sonipat' }],
  },
];

const ZONE_BY_ID = new Map(ZONES.map((zone) => [zone.id, zone]));

export const ZONE_IDS: readonly ZoneId[] = ZONES.map((zone) => zone.id);

export function getZone(id: ZoneId): Zone {
  const zone = ZONE_BY_ID.get(id);
  if (!zone) throw new Error(`Unknown zone: ${id}`);
  return zone;
}

export function isZoneId(value: unknown): value is ZoneId {
  return typeof value === 'string' && ZONE_BY_ID.has(value as ZoneId);
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Nearest covered district, or `null` when the point is clearly outside the NCR core. */
export function nearestZone(
  point: { latitude: number; longitude: number },
  maxDistanceKm = 45,
): { zone: ZoneId; distanceKm: number } | null {
  let best: { zone: ZoneId; distanceKm: number } | null = null;
  for (const zone of ZONES) {
    const distance = distanceKm(point, zone.centroid);
    if (!best || distance < best.distanceKm) best = { zone: zone.id, distanceKm: distance };
  }
  return best && best.distanceKm <= maxDistanceKm ? best : null;
}
