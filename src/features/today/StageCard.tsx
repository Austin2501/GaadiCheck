import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon } from '@/components/ui';
import type { GrapStatus, LanguageCode } from '@/domain/types';
import { localize } from '@/i18n';
import { formatRelative, formatShortDay } from '@/i18n/format';
import { colors, radius, spacing, stageColors } from '@/theme';

import { ROMAN_STAGES } from './verdictCopy';

interface StageCardProps {
  status: GrapStatus;
  isStale: boolean;
  onPress: () => void;
}

export function StageCard({ status, isStale, onPress }: StageCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const palette = stageColors[status.stage];
  const title =
    status.stage === 0
      ? t('today.stageNone')
      : t('today.stage', { stage: ROMAN_STAGES[status.stage] });

  const meta = [
    t('today.stageSince', { date: formatShortDay(new Date(status.effectiveFrom), language) }),
    isStale
      ? t('common.offline')
      : t('common.updated', { time: formatRelative(status.updatedAt, language) }),
  ].join(' · ');

  return (
    <Card onPress={onPress} accessibilityLabel={`${title}. ${meta}. ${t('today.stageMeaning')}`}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: palette.solid }]}>
          <AppText variant="heading" color={colors.inkInverse}>
            {ROMAN_STAGES[status.stage]}
          </AppText>
        </View>
        <View style={styles.text}>
          <AppText variant="subheading">{title}</AppText>
          <AppText variant="caption" color={isStale ? colors.caution : colors.inkSubtle}>
            {meta}
          </AppText>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.inkDisabled} />
      </View>
      <View style={[styles.note, { backgroundColor: palette.soft }]}>
        <AppText variant="callout" color={colors.ink}>
          {localize(status.note, language)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  note: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
});
