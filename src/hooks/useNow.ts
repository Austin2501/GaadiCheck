import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Current time that refreshes periodically and whenever the app returns to the foreground, so
 * date-based verdicts roll over at midnight without a restart.
 */
export function useNow(refreshMs = 15 * 60 * 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), refreshMs);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshMs]);

  return now;
}
