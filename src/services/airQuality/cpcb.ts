import { categoryForAqi } from '@/domain/airQuality';
import type { Zone } from '@/domain/zones';

import { fetchJson } from '../http';
import type { AqiReading } from './types';

const RESOURCE_URL = 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
const PARTICULATES = new Set(['PM2.5', 'PM10']);

/** Field names have changed over the feed's lifetime; both spellings are accepted. */
export interface CpcbRecord {
  station?: string;
  pollutant_id?: string;
  avg_value?: string | number;
  pollutant_avg?: string | number;
  last_update?: string;
}

interface CpcbResponse {
  records?: CpcbRecord[];
}

function numeric(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '' || value === 'NA') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** CPCB timestamps look like `22-11-2026 18:00:00` (IST). */
function toIsoTimestamp(value: string | undefined): string | null {
  const match = value ? /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/.exec(value) : null;
  if (!match) return null;
  const [, day, month, year, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00+05:30`;
}

/**
 * The feed publishes, per station and pollutant, the hourly AQI sub-index. A station's AQI is its
 * worst sub-index (only when particulate matter is reported) and the city figure is the mean of
 * its stations, matching CPCB's city bulletin.
 */
export function summarizeCpcbRecords(records: readonly CpcbRecord[]): AqiReading | null {
  const stations = new Map<
    string,
    { worst: number; pollutant: string; hasParticulates: boolean }
  >();
  let latest: string | null = null;

  for (const record of records) {
    const station = record.station?.trim();
    const pollutant = record.pollutant_id?.trim().toUpperCase();
    const value = numeric(record.avg_value ?? record.pollutant_avg);
    if (!station || !pollutant || value === null) continue;

    const entry = stations.get(station) ?? { worst: -1, pollutant, hasParticulates: false };
    if (value > entry.worst) {
      entry.worst = value;
      entry.pollutant = pollutant;
    }
    entry.hasParticulates ||= PARTICULATES.has(pollutant);
    stations.set(station, entry);

    const timestamp = toIsoTimestamp(record.last_update);
    if (timestamp && (!latest || timestamp > latest)) latest = timestamp;
  }

  const valid = [...stations.values()].filter((station) => station.hasParticulates);
  if (valid.length === 0) return null;

  const aqi = Math.round(valid.reduce((sum, station) => sum + station.worst, 0) / valid.length);
  const counts = new Map<string, number>();
  for (const station of valid)
    counts.set(station.pollutant, (counts.get(station.pollutant) ?? 0) + 1);
  const prominent = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'PM2.5';

  return {
    aqi: Math.min(aqi, 500),
    category: categoryForAqi(aqi),
    prominent,
    source: 'cpcb',
    observedAt: latest ?? new Date().toISOString(),
    stationCount: valid.length,
  };
}

export async function fetchCpcbAirQuality(
  zone: Zone,
  apiKey: string,
  signal?: AbortSignal,
): Promise<AqiReading | null> {
  const batches = await Promise.all(
    zone.cpcb.map(async ({ state, city }) => {
      const params = new URLSearchParams({
        'api-key': apiKey,
        format: 'json',
        limit: '1000',
        'filters[state]': state,
        'filters[city]': city,
      });
      const response = await fetchJson<CpcbResponse>(`${RESOURCE_URL}?${params.toString()}`, {
        signal,
      });
      return response.records ?? [];
    }),
  );
  return summarizeCpcbRecords(batches.flat());
}
