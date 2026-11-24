import type { TFunction } from 'i18next';

import type { LanguageCode, Vehicle, VehicleAssessment, ZoneId } from '@/domain/types';
import { getZone } from '@/domain/zones';
import { localize } from '@/i18n';
import { formatRupees } from '@/i18n/format';

export function zoneLabel(zone: ZoneId, language: LanguageCode): string {
  return localize(getZone(zone).shortName, language);
}

export function verdictCopy(
  assessment: VehicleAssessment,
  vehicle: Vehicle,
  t: TFunction,
  language: LanguageCode,
): { title: string; body: string } {
  const { headline } = assessment;
  const home = zoneLabel(vehicle.homeZone, language);

  switch (headline.reason) {
    case 'all-clear':
      return { title: t('today.verdict.goTitle'), body: t('today.verdict.goBody') };
    case 'home-blocked':
      return {
        title: t('today.verdict.homeBlockedTitle', { zone: home }),
        body: t('today.verdict.homeBlockedBody'),
      };
    case 'some-zones-blocked':
      return {
        title: t('today.verdict.someZonesBlockedTitle', {
          zones: headline.blockedZones.map((zone) => zoneLabel(zone, language)).join(', '),
        }),
        body: t('today.verdict.someZonesBlockedBody', { zone: home }),
      };
    case 'needs-info':
      return { title: t('today.verdict.needsInfoTitle'), body: t('today.verdict.needsInfoBody') };
    case 'check-order':
      return { title: t('today.verdict.checkOrderTitle'), body: t('today.verdict.checkOrderBody') };
    case 'document-expired': {
      const kind = headline.documentKind === 'insurance' ? 'insurance' : 'puc';
      const document = t(`docs.kinds.${kind}`);
      const fine = assessment.documents.find((doc) => doc.kind === kind)?.fineInr;
      return {
        title: t('today.verdict.documentExpiredTitle', { document }),
        body: fine
          ? t('today.verdict.documentExpiredBodyFine', { document, amount: formatRupees(fine) })
          : t('today.verdict.documentExpiredBody', { document }),
      };
    }
    case 'document-missing':
      return {
        title: t('today.verdict.documentMissingTitle'),
        body: t('today.verdict.documentMissingBody'),
      };
  }
}

/** Short summary such as "Diesel · BS-IV · Car". */
export function vehicleSummary(vehicle: Vehicle, t: TFunction, bsLabel: string | null): string {
  return [t(`vehicle.fuels.${vehicle.fuel}`), bsLabel, t(`vehicle.types.${vehicle.vehicleType}`)]
    .filter(Boolean)
    .join(' · ');
}

export const ROMAN_STAGES = ['0', 'I', 'II', 'III', 'IV'] as const;
