import { Redirect } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Screen } from '@/components/ui';
import { formatPlate } from '@/domain/registration';
import type { LanguageCode } from '@/domain/types';
import { ShareCard } from '@/features/share/ShareCard';
import { ROMAN_STAGES, verdictCopy } from '@/features/today/verdictCopy';
import { useAssessment } from '@/hooks/useAssessment';
import { track } from '@/services/analytics';
import { shareViewAsImage } from '@/services/share';
import { useActiveVehicle } from '@/store/garage';
import { colors, spacing } from '@/theme';

export default function SharePreview() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const vehicle = useActiveVehicle();
  const assessment = useAssessment(vehicle);
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!vehicle || !assessment) return <Redirect href="/(tabs)" />;

  const share = async () => {
    setSharing(true);
    try {
      const caption = t('share.caption', {
        headline: verdictCopy(assessment, vehicle, t, language).title,
        plate: formatPlate(vehicle.plate),
        stage: ROMAN_STAGES[assessment.stage],
      });
      const result = await shareViewAsImage(cardRef, caption, t('share.title'));
      if (result === 'unavailable') {
        Alert.alert(t('share.unavailable'));
        return;
      }
      setCopied(true);
      track('verdict_shared', { tone: assessment.headline.tone, stage: assessment.stage });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen
      edges={[]}
      footer={
        <Button
          label={t('share.button')}
          icon="share-social-outline"
          loading={sharing}
          onPress={() => void share()}
        />
      }
    >
      <View style={styles.preview}>
        <ShareCard ref={cardRef} vehicle={vehicle} assessment={assessment} />
      </View>
      {copied ? (
        <Banner tone="success" message={t('share.captionCopied')} />
      ) : (
        <AppText variant="callout" color={colors.inkMuted} align="center">
          {t('share.hint')}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
});
