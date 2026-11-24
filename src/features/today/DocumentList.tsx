import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Card, ListRow, StatusPill } from '@/components/ui';
import type { DocumentCheck, DocumentState, HeadlineTone, LanguageCode } from '@/domain/types';
import { formatCalendarDate } from '@/i18n/format';
import { openLink } from '@/services/links';
import { colors, spacing } from '@/theme';

const STATE_TONE: Record<DocumentState, HeadlineTone> = {
  valid: 'go',
  ok: 'go',
  'not-required': 'go',
  'covered-new': 'go',
  expiring: 'caution',
  missing: 'caution',
  expired: 'stop',
  'end-of-life': 'stop',
};

const KIND_ICON = {
  puc: 'leaf-outline',
  insurance: 'shield-checkmark-outline',
  age: 'time-outline',
} as const;

interface DocumentListProps {
  documents: DocumentCheck[];
  onEdit: () => void;
}

export function DocumentList({ documents, onEdit }: DocumentListProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const visible = documents.filter((doc) => doc.kind !== 'age' || doc.state === 'end-of-life');
  const puc = documents.find((doc) => doc.kind === 'puc');
  const needsPucCentre =
    puc?.state === 'expired' || puc?.state === 'expiring' || puc?.state === 'missing';

  const describe = (doc: DocumentCheck): string => {
    const date = doc.date ? formatCalendarDate(doc.date, language) : '';
    const base = t(`docs.states.${doc.state}`, {
      date,
      age: doc.ageYears,
      limit: doc.ageLimitYears,
    });
    if ((doc.state === 'valid' || doc.state === 'expiring') && doc.daysLeft !== null) {
      return `${base} · ${t('docs.daysLeft', { count: doc.daysLeft })}`;
    }
    if (doc.state === 'end-of-life') return `${base}. ${t('docs.endOfLifeHint')}`;
    return base;
  };

  return (
    <Card padded={false}>
      {visible.map((doc, index) => {
        const tone = STATE_TONE[doc.state];
        return (
          <ListRow
            key={doc.kind}
            icon={KIND_ICON[doc.kind]}
            iconColor={
              tone === 'go' ? colors.primary : tone === 'caution' ? colors.caution : colors.stop
            }
            iconBackground={
              tone === 'go'
                ? colors.primarySoft
                : tone === 'caution'
                  ? colors.cautionSoft
                  : colors.stopSoft
            }
            title={t(`docs.kinds.${doc.kind}`)}
            subtitle={describe(doc)}
            trailing={<StatusPill tone={tone} label={t(`docs.pill.${doc.state}`)} />}
            onPress={doc.kind === 'age' ? undefined : onEdit}
            last={index === visible.length - 1 && !needsPucCentre}
          />
        );
      })}
      {needsPucCentre ? (
        <View style={styles.footer}>
          <ListRow
            icon="navigate-outline"
            title={t('docs.findPuc')}
            onPress={() => void openLink('pucCentresNearby')}
            trailing={null}
            last
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: spacing.xxs,
  },
});
