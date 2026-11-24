import { useQueries, useQuery } from '@tanstack/react-query';

import type { ZoneId } from '@/domain/types';
import { ZONE_IDS } from '@/domain/zones';
import { getZoneAirQuality } from '@/services/airQuality';
import {
  bundledGrapStatus,
  bundledRuleBook,
  fetchGrapStatus,
  fetchRuleBook,
} from '@/services/grapFeed';

const MINUTE = 60_000;

export const queryKeys = {
  grapStatus: ['grap-status'] as const,
  ruleBook: ['rule-book'] as const,
  airQuality: (zone: ZoneId) => ['air-quality', zone] as const,
};

/** Always has data: the bundled snapshot until the feed (or the persisted cache) replaces it. */
export function useGrapStatus() {
  return useQuery({
    queryKey: queryKeys.grapStatus,
    queryFn: ({ signal }) => fetchGrapStatus(signal),
    initialData: bundledGrapStatus,
    initialDataUpdatedAt: 0,
    staleTime: 10 * MINUTE,
    refetchInterval: 30 * MINUTE,
  });
}

export function useRuleBook() {
  return useQuery({
    queryKey: queryKeys.ruleBook,
    queryFn: ({ signal }) => fetchRuleBook(signal),
    initialData: bundledRuleBook,
    initialDataUpdatedAt: 0,
    staleTime: 6 * 60 * MINUTE,
  });
}

function airQualityQuery(zone: ZoneId) {
  return {
    queryKey: queryKeys.airQuality(zone),
    queryFn: ({ signal }: { signal: AbortSignal }) => getZoneAirQuality(zone, signal),
    staleTime: 30 * MINUTE,
  };
}

export function useZoneAirQuality(zone: ZoneId | null) {
  return useQuery({
    ...airQualityQuery(zone ?? 'delhi'),
    enabled: zone !== null,
  });
}

export function useAllZonesAirQuality() {
  return useQueries({ queries: ZONE_IDS.map(airQualityQuery) });
}
