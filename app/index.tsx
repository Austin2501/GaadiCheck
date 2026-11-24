import { Redirect } from 'expo-router';

import { usePreferences } from '@/store/preferences';

export default function Entry() {
  const hasOnboarded = usePreferences((state) => state.hasOnboarded);
  return <Redirect href={hasOnboarded ? '/(tabs)' : '/onboarding'} />;
}
