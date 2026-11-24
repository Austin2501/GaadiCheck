import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import type { LanguageCode } from '@/domain/types';
import { formatRelative } from '@/i18n/format';
import type { AqiReading } from '@/services/airQuality';
import { colors } from '@/theme';

interface SourceLabelProps {
  reading: AqiReading;
  /** Appends how long ago the reading was taken. */
  showUpdated?: boolean;
}

/** Where a reading comes from (CPCB stations or the model) and what is driving it. */
export function SourceLabel({ reading, showUpdated = false }: SourceLabelProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const parts = [
    reading.source === 'cpcb'
      ? t('air.sourceCpcb', { count: reading.stationCount ?? 1 })
      : t('air.sourceModel'),
    t('air.prominent', { pollutant: reading.prominent }),
  ];
  if (showUpdated) {
    parts.push(t('common.updated', { time: formatRelative(reading.observedAt, language) }));
  }

  return (
    <AppText variant="caption" color={colors.inkSubtle}>
      {parts.join(' · ')}
    </AppText>
  );
}
