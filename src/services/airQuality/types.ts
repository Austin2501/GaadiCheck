import type { AqiCategory } from '@/domain/airQuality';
import type { ZoneId } from '@/domain/types';

export type AqiSource = 'cpcb' | 'model';

export interface AqiReading {
  aqi: number;
  category: AqiCategory;
  /** Pollutant driving the index, using CPCB naming (e.g. `PM2.5`, `PM10`, `NO2`). */
  prominent: string;
  source: AqiSource;
  /** ISO timestamp of the latest data point used. */
  observedAt: string;
  stationCount?: number;
}

export interface ZoneAirQuality {
  zone: ZoneId;
  current: AqiReading | null;
  tomorrow: AqiReading | null;
}
