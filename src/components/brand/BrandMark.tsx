import { useId } from 'react';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The GaadiCheck mark on a 64-unit grid: a car seen head-on with a marigold check badge.
 * Geometry mirrors brand/logo-mark.svg; regenerate the brand files if it changes.
 */
const CABIN =
  'M17.55 34.6 L20.65 25.6 C21.15 24.1 22.55 23.1 24.15 23.1 L32.15 23.1 C33.75 23.1 35.15 24.1 35.65 25.6 L38.75 34.6 Z';
const WINDSHIELD =
  'M20.45 32.8 L22.65 27 C22.9 26.35 23.5 25.9 24.2 25.9 L32.1 25.9 C32.8 25.9 33.4 26.35 33.65 27 L35.85 32.8 Z';
const BODY = { x: 9.65, y: 33, width: 37, height: 13.6, rx: 4.8 };
const WHEELS = [
  { x: 12.55, y: 44.2, width: 6.6, height: 6.6, rx: 2.2 },
  { x: 37.15, y: 44.2, width: 6.6, height: 6.6, rx: 2.2 },
];
const LIGHTS = [
  { x: 12.55, y: 36.9, width: 6.6, height: 3.8, rx: 1.9 },
  { x: 37.15, y: 36.9, width: 6.6, height: 3.8, rx: 1.9 },
];
const PLATE = { x: 23.15, y: 39.3, width: 10, height: 4, rx: 1.1 };
const CHECK = 'M42.05 22.7 L44.95 25.6 L50.35 19.9';

/** Badge position on the 64-unit grid, for laying out the badge on its own. */
export const MARK_BADGE = { cx: 46.15, cy: 22.6, r: 8.2 } as const;

interface BrandMarkProps {
  size?: number;
  /** `inverse` drops the tile for use on indigo surfaces. */
  variant?: 'tile' | 'inverse';
  /** The launch animation draws the badge separately so it can stamp it on. */
  showBadge?: boolean;
}

export function BrandMark({ size = 40, variant = 'tile', showBadge = true }: BrandMarkProps) {
  // Mask ids must be unique per document on the web; useId output isn't a valid url() fragment.
  const maskId = `gc-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityRole="image"
      accessibilityLabel="GaadiCheck"
    >
      <Defs>
        <Mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={64} height={64}>
          <Rect width={64} height={64} fill="#fff" />
          <Path d={WINDSHIELD} fill="#000" />
          {LIGHTS.map((light) => (
            <Rect key={light.x} {...light} fill="#000" />
          ))}
          <Rect {...PLATE} fill="#000" />
        </Mask>
      </Defs>
      {variant === 'tile' ? <Rect width={64} height={64} rx={15} fill={colors.primary} /> : null}
      <G mask={`url(#${maskId})`} fill={colors.surface}>
        <Path d={CABIN} />
        <Rect {...BODY} />
        {WHEELS.map((wheel) => (
          <Rect key={wheel.x} {...wheel} />
        ))}
      </G>
      {showBadge ? <BadgeShapes /> : null}
    </Svg>
  );
}

function BadgeShapes() {
  return (
    <>
      <Circle cx={MARK_BADGE.cx} cy={MARK_BADGE.cy} r={MARK_BADGE.r} fill={colors.accent} />
      <Path
        d={CHECK}
        stroke={colors.primary}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  );
}

/** The check badge alone, sized to sit exactly over a BrandMark of `markSize`. */
export function MarkBadge({ markSize }: { markSize: number }) {
  const { cx, cy, r } = MARK_BADGE;
  const size = ((r * 2) / 64) * markSize;
  return (
    <Svg width={size} height={size} viewBox={`${cx - r} ${cy - r} ${r * 2} ${r * 2}`}>
      <BadgeShapes />
    </Svg>
  );
}
