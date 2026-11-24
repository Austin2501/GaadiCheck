import { env } from '@/config/env';
import { BUNDLED_GRAP_STATUS, BUNDLED_RULE_BOOK } from '@/data/bundled';
import { grapStatusSchema, ruleBookSchema } from '@/domain/schemas';
import type { GrapStatus, RuleBook } from '@/domain/types';

import { fetchJson } from './http';

export type FeedSource = 'remote' | 'bundled';

export interface FeedResult<T> {
  data: T;
  source: FeedSource;
}

/** Changes every minute so CDN caches in front of the raw files never serve stale stages for long. */
function cacheBuster(): string {
  return String(Math.floor(Date.now() / 60_000));
}

function feedUrl(file: string): string | null {
  return env.dataBaseUrl ? `${env.dataBaseUrl}/${file}?v=${cacheBuster()}` : null;
}

export const bundledGrapStatus: FeedResult<GrapStatus> = {
  data: BUNDLED_GRAP_STATUS,
  source: 'bundled',
};

export const bundledRuleBook: FeedResult<RuleBook> = {
  data: BUNDLED_RULE_BOOK,
  source: 'bundled',
};

export async function fetchGrapStatus(signal?: AbortSignal): Promise<FeedResult<GrapStatus>> {
  const url = feedUrl('grap-status.json');
  if (!url) return bundledGrapStatus;
  const payload = await fetchJson(url, { signal });
  return { data: grapStatusSchema.parse(payload), source: 'remote' };
}

export async function fetchRuleBook(signal?: AbortSignal): Promise<FeedResult<RuleBook>> {
  const url = feedUrl('rules.json');
  if (!url) return bundledRuleBook;
  const remote = ruleBookSchema.parse(await fetchJson(url, { signal }));
  // An app release can ship rules newer than the published feed; never step backwards.
  return remote.version >= BUNDLED_RULE_BOOK.version
    ? { data: remote, source: 'remote' }
    : bundledRuleBook;
}
