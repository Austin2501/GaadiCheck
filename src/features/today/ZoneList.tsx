import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, StatusPill } from '@/components/ui';
import type { Finding, LanguageCode, Vehicle, ZoneVerdict } from '@/domain/types';
import { localize } from '@/i18n';
import { formatRupees } from '@/i18n/format';
import { openUrl } from '@/services/links';
import { colors, MIN_TOUCH_TARGET, radius, spacing, zoneStatusTone } from '@/theme';

import { zoneLabel } from './verdictCopy';

interface ZoneListProps {
  vehicle: Vehicle;
  zones: ZoneVerdict[];
}

/** Home district first, Delhi next, then the rest in their usual order. */
function sortZones(zones: ZoneVerdict[], vehicle: Vehicle): ZoneVerdict[] {
  const rank = (zone: ZoneVerdict) =>
    zone.zone === vehicle.homeZone ? 0 : zone.zone === 'delhi' ? 1 : 2;
  return [...zones].sort((a, b) => rank(a) - rank(b));
}

function FindingDetail({ finding }: { finding: Finding }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  return (
    <View style={styles.finding}>
      <AppText variant="calloutStrong">{localize(finding.title, language)}</AppText>
      <AppText variant="callout" color={colors.inkMuted}>
        {localize(finding.explanation, language)}
      </AppText>
      {finding.certainty === 'needs-info' ? (
        <AppText variant="caption" color={colors.caution}>
          {t('today.needsInfoFinding')}
        </AppText>
      ) : null}
      <View style={styles.findingFooter}>
        <AppText variant="caption" color={colors.inkSubtle}>
          {finding.fineInr
            ? t('today.fineUpTo', { amount: formatRupees(finding.fineInr) })
            : t('today.fineAsPerOrder')}
        </AppText>
        <Pressable
          accessibilityRole="link"
          onPress={() => void openUrl(finding.sourceUrl)}
          hitSlop={10}
        >
          <AppText variant="caption" color={colors.primary}>
            {t('common.viewOrder')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ZoneRow({
  verdict,
  isHome,
  last,
}: {
  verdict: ZoneVerdict;
  isHome: boolean;
  last: boolean;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const [expanded, setExpanded] = useState(verdict.status !== 'allowed' && isHome);
  const expandable = verdict.findings.length > 0;
  const name = zoneLabel(verdict.zone, language);
  const statusLabel = t(`today.status.${verdict.status}`);

  return (
    <View style={!last && styles.divider}>
      <Pressable
        disabled={!expandable}
        accessibilityRole={expandable ? 'button' : undefined}
        accessibilityState={expandable ? { expanded } : undefined}
        accessibilityLabel={`${name}${isHome ? `, ${t('today.homeTag')}` : ''}: ${statusLabel}`}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.name}>
          <AppText variant="bodyStrong">{name}</AppText>
          {isHome ? (
            <View style={styles.homeTag}>
              <AppText variant="caption" color={colors.primary}>
                {t('today.homeTag')}
              </AppText>
            </View>
          ) : null}
        </View>
        <StatusPill tone={zoneStatusTone[verdict.status]} label={statusLabel} />
        {expandable ? (
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.inkSubtle}
          />
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </Pressable>
      {expanded
        ? verdict.findings.map((finding) => (
            <FindingDetail key={finding.ruleId} finding={finding} />
          ))
        : null}
    </View>
  );
}

export function ZoneList({ vehicle, zones }: ZoneListProps) {
  const sorted = sortZones(zones, vehicle);
  return (
    <Card padded={false}>
      {sorted.map((verdict, index) => (
        <ZoneRow
          key={verdict.zone}
          verdict={verdict}
          isHome={verdict.zone === vehicle.homeZone}
          last={index === sorted.length - 1}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  homeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  iconSpacer: {
    width: 18,
  },
  finding: {
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  findingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
