import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Card } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import type { GrapStage } from '@/domain/types';
import { useGrapStatus } from '@/hooks/queries';
import { openLink } from '@/services/links';
import { colors, radius, spacing, stageColors } from '@/theme';

const STAGES: { stage: Exclude<GrapStage, 0>; key: 'stage1' | 'stage2' | 'stage3' | 'stage4' }[] = [
  { stage: 1, key: 'stage1' },
  { stage: 2, key: 'stage2' },
  { stage: 3, key: 'stage3' },
  { stage: 4, key: 'stage4' },
];

export default function GrapGuide() {
  const { t } = useTranslation();
  const current = useGrapStatus().data.data.stage;

  return (
    <Screen edges={[]}>
      <AppText variant="body" color={colors.inkMuted}>
        {t('guide.intro')}
      </AppText>

      {STAGES.map(({ stage, key }) => {
        const palette = stageColors[stage];
        const active = stage === current;
        return (
          <Card
            key={key}
            style={[styles.stageCard, active && { borderColor: palette.solid, borderWidth: 2 }]}
          >
            <View style={[styles.stripe, { backgroundColor: palette.solid }]} />
            <View style={styles.stageBody}>
              <View style={styles.stageHeader}>
                <AppText variant="subheading">{t(`guide.${key}Title`)}</AppText>
                <View style={[styles.range, { backgroundColor: palette.soft }]}>
                  <AppText variant="caption" color={palette.solid}>
                    {t(`guide.${key}Range`)}
                  </AppText>
                </View>
              </View>
              <AppText variant="callout" color={colors.inkMuted}>
                {t(`guide.${key}Body`)}
              </AppText>
            </View>
          </Card>
        );
      })}

      <Card>
        <AppText variant="subheading">{t('guide.entryTitle')}</AppText>
        <AppText variant="callout" color={colors.inkMuted} style={styles.paragraph}>
          {t('guide.entryBody')}
        </AppText>
      </Card>
      <Card>
        <AppText variant="subheading">{t('guide.pucTitle')}</AppText>
        <AppText variant="callout" color={colors.inkMuted} style={styles.paragraph}>
          {t('guide.pucBody')}
        </AppText>
      </Card>

      <Banner tone="info" message={t('guide.note')} />
      <Button
        label={t('guide.openCaqm')}
        icon="open-outline"
        variant="secondary"
        onPress={() => void openLink('caqm')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stageCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  stripe: {
    width: 6,
  },
  stageBody: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  range: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  paragraph: {
    marginTop: spacing.sm,
  },
});
