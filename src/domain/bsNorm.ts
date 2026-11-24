import { daysBetween } from './dates';
import type { BsNorm, IsoDate, VehicleType } from './types';

interface NormTimeline {
  bs3: IsoDate;
  bs4: IsoDate;
  bs6: IsoDate;
}

/**
 * Registration cut-overs for new vehicles. Delhi-NCR moved four-wheelers to BS-III and BS-IV
 * five to seven years ahead of the national roll-out; two-wheelers followed the national dates.
 */
const NCR_FOUR_WHEELERS: NormTimeline = { bs3: '2005-04-01', bs4: '2010-04-01', bs6: '2020-04-01' };
const NATIONAL: NormTimeline = { bs3: '2010-04-01', bs4: '2017-04-01', bs6: '2020-04-01' };

/** Dealers registered old stock for a while after each cut-over, so nearby dates stay unconfirmed. */
const TRANSITION_WINDOW_DAYS = 120;

export interface BsNormSuggestion {
  norm: BsNorm;
  confidence: 'likely' | 'uncertain';
}

export function suggestBsNorm(options: {
  registrationDate: IsoDate;
  vehicleType: VehicleType;
  registeredInNcr: boolean;
}): BsNormSuggestion {
  const { registrationDate, vehicleType, registeredInNcr } = options;
  const timeline = registeredInNcr && vehicleType !== 'two-wheeler' ? NCR_FOUR_WHEELERS : NATIONAL;

  const norm: BsNorm =
    registrationDate >= timeline.bs6
      ? 6
      : registrationDate >= timeline.bs4
        ? 4
        : registrationDate >= timeline.bs3
          ? 3
          : 2;

  const nearTransition = [timeline.bs3, timeline.bs4, timeline.bs6].some(
    (milestone) => Math.abs(daysBetween(milestone, registrationDate)) <= TRANSITION_WINDOW_DAYS,
  );

  return { norm, confidence: nearTransition ? 'uncertain' : 'likely' };
}

export const BS_NORM_OPTIONS: readonly BsNorm[] = [2, 3, 4, 6];

export function formatBsNorm(norm: BsNorm): string {
  switch (norm) {
    case 2:
      return 'BS-II';
    case 3:
      return 'BS-III';
    case 4:
      return 'BS-IV';
    case 6:
      return 'BS-VI';
  }
}
