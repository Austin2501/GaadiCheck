function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes('<')) return null;
  return trimmed;
}

/**
 * Build-time configuration. `EXPO_PUBLIC_*` values are inlined into the bundle, so nothing here
 * may be a secret that grants write access to anything.
 */
export const env = {
  dataBaseUrl: clean(process.env.EXPO_PUBLIC_DATA_BASE_URL)?.replace(/\/+$/, '') ?? null,
  dataGovApiKey: clean(process.env.EXPO_PUBLIC_DATA_GOV_API_KEY),
  posthogKey: clean(process.env.EXPO_PUBLIC_POSTHOG_KEY),
  posthogHost: clean(process.env.EXPO_PUBLIC_POSTHOG_HOST) ?? 'https://us.i.posthog.com',
} as const;
