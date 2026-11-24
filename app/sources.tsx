import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { AppText, Card, ListRow, Screen, SectionHeader, type IconName } from '@/components/ui';
import type { LinkKey } from '@/config/links';
import { useRuleBook } from '@/hooks/queries';
import { openLink } from '@/services/links';
import { colors, spacing } from '@/theme';

type SourceKey = 'grap' | 'cpcb' | 'openMeteo' | 'ocr' | 'fonts';

const SOURCES: { key: SourceKey; icon: IconName; link?: LinkKey }[] = [
  { key: 'grap', icon: 'layers-outline', link: 'caqm' },
  { key: 'cpcb', icon: 'pulse-outline', link: 'dataGov' },
  { key: 'openMeteo', icon: 'cloud-outline', link: 'openMeteo' },
  { key: 'ocr', icon: 'scan-outline' },
  { key: 'fonts', icon: 'text-outline' },
];

export default function Sources() {
  const { t } = useTranslation();
  const { data: ruleBook } = useRuleBook();
  const feed = ruleBook.source === 'remote' ? 'sources.feedRemote' : 'sources.feedBundled';

  return (
    <Screen edges={[]}>
      <SectionHeader title={t('sources.dataTitle')} />
      <Card padded={false}>
        {SOURCES.map(({ key, icon, link }, index) => (
          <ListRow
            key={key}
            icon={icon}
            title={t(`sources.${key}`)}
            subtitle={t(`sources.${key}By`)}
            onPress={link ? () => void openLink(link) : undefined}
            last={index === SOURCES.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title={t('sources.feedTitle')} />
      <Card padded={false}>
        <ListRow
          icon={ruleBook.source === 'remote' ? 'cloud-done-outline' : 'archive-outline'}
          title={t(feed, { version: ruleBook.data.version })}
          subtitle={ruleBook.data.updatedAt.slice(0, 10)}
          last
        />
      </Card>

      <Card>
        <AppText variant="subheading">{t('sources.privacyTitle')}</AppText>
        <AppText variant="callout" color={colors.inkMuted} style={styles.paragraph}>
          {t('sources.privacyBody')}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    marginTop: spacing.sm,
  },
});
