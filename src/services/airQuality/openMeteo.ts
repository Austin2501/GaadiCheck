import { computeIndianAqi, meanOf, type Pollutant } from '@/domain/airQuality';
import { addDays, toIstDateKey } from '@/domain/dates';
import type { Zone } from '@/domain/zones';

import { fetchJson } from '../http';
import type { AqiReading } from './types';

const ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
/** CPCB only reports a 24-hour average when at least 16 hourly values are present. */
const MIN_HOURLY_SAMPLES = 16;
const PROMINENT_LABEL: Record<Pollutant, string> = { pm25: 'PM2.5', pm10: 'PM10' };

export interface OpenMeteoHourly {
  time: string[];
  pm2_5: (number | null)[];
  pm10: (number | null)[];
}

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
}

function istHourKey(instant: Date): string {
  return new Date(instant.getTime() + 330 * 60_000).toISOString().slice(0, 13) + ':00';
}

function toReading(
  hourly: OpenMeteoHourly,
  indices: number[],
  observedAt: string,
): AqiReading | null {
  const result = computeIndianAqi({
    pm25: meanOf(
      indices.map((index) => hourly.pm2_5[index]),
      MIN_HOURLY_SAMPLES,
    ),
    pm10: meanOf(
      indices.map((index) => hourly.pm10[index]),
      MIN_HOURLY_SAMPLES,
    ),
  });
  if (!result) return null;
  return {
    aqi: result.aqi,
    category: result.category,
    prominent: PROMINENT_LABEL[result.prominent],
    source: 'model',
    observedAt,
  };
}

/**
 * Turns Open-Meteo hourly concentrations (local IST timestamps) into the trailing 24-hour AQI and
 * a whole-day estimate for tomorrow, mirroring how CPCB averages particulate matter.
 */
export function summarizeHourly(
  hourly: OpenMeteoHourly,
  now: Date,
): { current: AqiReading | null; tomorrow: AqiReading | null } {
  const nowKey = istHourKey(now);
  let currentIndex = -1;
  hourly.time.forEach((time, index) => {
    if (time <= nowKey) currentIndex = index;
  });

  const current =
    currentIndex >= 0
      ? toReading(
          hourly,
          Array.from({ length: 24 }, (_, offset) => currentIndex - offset).filter(
            (index) => index >= 0,
          ),
          `${hourly.time[currentIndex]}:00+05:30`,
        )
      : null;

  const tomorrowKey = addDays(toIstDateKey(now), 1);
  const tomorrowIndices = hourly.time
    .map((time, index) => (time.startsWith(tomorrowKey) ? index : -1))
    .filter((index) => index >= 0);
  const tomorrow = toReading(hourly, tomorrowIndices, `${tomorrowKey}T00:00:00+05:30`);

  return { current, tomorrow };
}

export async function fetchModelledAirQuality(
  zone: Zone,
  now: Date,
  signal?: AbortSignal,
): Promise<{ current: AqiReading | null; tomorrow: AqiReading | null }> {
  const params = new URLSearchParams({
    latitude: String(zone.centroid.latitude),
    longitude: String(zone.centroid.longitude),
    hourly: 'pm2_5,pm10',
    past_days: '1',
    forecast_days: '2',
    timezone: 'Asia/Kolkata',
  });
  const response = await fetchJson<OpenMeteoResponse>(`${ENDPOINT}?${params.toString()}`, {
    signal,
  });
  if (!response.hourly?.time?.length) return { current: null, tomorrow: null };
  return summarizeHourly(response.hourly, now);
}
