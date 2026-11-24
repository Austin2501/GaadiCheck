import PostHog from 'posthog-react-native';

import { env } from '@/config/env';

export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'vehicle_added'
  | 'vehicle_updated'
  | 'vehicle_removed'
  | 'document_scanned'
  | 'location_used'
  | 'verdict_shared'
  | 'alerts_toggled'
  | 'reminders_toggled'
  | 'language_changed'
  | 'link_opened';

type EventProperties = Record<string, string | number | boolean | null>;

let client: PostHog | null | undefined;

function analytics(): PostHog | null {
  if (client !== undefined) return client;
  client = env.posthogKey
    ? new PostHog(env.posthogKey, { host: env.posthogHost, captureAppLifecycleEvents: true })
    : null;
  return client;
}

/**
 * Anonymous product analytics, active only when a PostHog key is configured. Never pass
 * registration numbers, dates or anything else that identifies a person or vehicle.
 */
export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  analytics()?.capture(event, properties);
}

export function trackScreen(name: string): void {
  void analytics()?.screen(name);
}
