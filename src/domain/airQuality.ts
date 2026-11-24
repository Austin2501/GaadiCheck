import type { GrapStage } from './types';

export type AqiCategory = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very-poor' | 'severe';

export type Pollutant = 'pm25' | 'pm10';

interface Breakpoint {
  cLo: number;
  cHi: number;
  iLo: number;
  iHi: number;
}

/**
 * CPCB National AQI breakpoints for 24-hour average concentrations (µg/m³). The Severe band is
 * open-ended in the standard; it is interpolated up to the index ceiling of 500.
 */
const BREAKPOINTS: Record<Pollutant, readonly Breakpoint[]> = {
  pm25: [
    { cLo: 0, cHi: 30, iLo: 0, iHi: 50 },
    { cLo: 31, cHi: 60, iLo: 51, iHi: 100 },
    { cLo: 61, cHi: 90, iLo: 101, iHi: 200 },
    { cLo: 91, cHi: 120, iLo: 201, iHi: 300 },
    { cLo: 121, cHi: 250, iLo: 301, iHi: 400 },
    { cLo: 251, cHi: 380, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
    { cLo: 51, cHi: 100, iLo: 51, iHi: 100 },
    { cLo: 101, cHi: 250, iLo: 101, iHi: 200 },
    { cLo: 251, cHi: 350, iLo: 201, iHi: 300 },
    { cLo: 351, cHi: 430, iLo: 301, iHi: 400 },
    { cLo: 431, cHi: 510, iLo: 401, iHi: 500 },
  ],
};

export const AQI_MAX = 500;

/** Sub-index for one pollutant, or `null` for missing/invalid readings. */
export function subIndex(
  pollutant: Pollutant,
  concentration: number | null | undefined,
): number | null {
  if (concentration === null || concentration === undefined) return null;
  if (!Number.isFinite(concentration) || concentration < 0) return null;

  const bands = BREAKPOINTS[pollutant];
  const top = bands[bands.length - 1]!;
  if (concentration > top.cHi) return AQI_MAX;

  const band = bands.find((candidate) => concentration <= candidate.cHi) ?? top;
  // The standard publishes integer bounds; readings between two bands snap to the upper band's floor.
  const effective = Math.max(concentration, band.cLo);
  const value = band.iLo + ((effective - band.cLo) * (band.iHi - band.iLo)) / (band.cHi - band.cLo);
  return Math.round(value);
}

export function categoryForAqi(aqi: number): AqiCategory {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very-poor';
  return 'severe';
}

export interface AqiResult {
  aqi: number;
  category: AqiCategory;
  prominent: Pollutant;
}

/** Overall AQI is the worst sub-index among the available pollutants. */
export function computeIndianAqi(
  averages: Partial<Record<Pollutant, number | null>>,
): AqiResult | null {
  let best: { aqi: number; prominent: Pollutant } | null = null;
  for (const pollutant of Object.keys(BREAKPOINTS) as Pollutant[]) {
    const index = subIndex(pollutant, averages[pollutant]);
    if (index !== null && (!best || index > best.aqi)) best = { aqi: index, prominent: pollutant };
  }
  return best ? { ...best, category: categoryForAqi(best.aqi) } : null;
}

/** Mean of the valid samples, or `null` when fewer than `minSamples` are present. */
export function meanOf(
  values: readonly (number | null | undefined)[],
  minSamples: number,
): number | null {
  const valid = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (valid.length < minSamples) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

/**
 * GRAP stage that the Delhi AQI band corresponds to. CAQM decides the actual stage and often
 * acts on forecasts, so this is only an indication.
 */
export function indicativeStageForAqi(aqi: number): GrapStage {
  if (aqi > 450) return 4;
  if (aqi > 400) return 3;
  if (aqi > 300) return 2;
  if (aqi > 200) return 1;
  return 0;
}
