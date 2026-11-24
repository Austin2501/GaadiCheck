import { StyleSheet, Text, View } from 'react-native';

import { formatPlate } from '@/domain/registration';
import { colors, fonts } from '@/theme';

interface PlateBadgeProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { fontSize: 13, paddingHorizontal: 10, paddingVertical: 3, rivet: 3 },
  md: { fontSize: 16, paddingHorizontal: 14, paddingVertical: 5, rivet: 4 },
  lg: { fontSize: 22, paddingHorizontal: 18, paddingVertical: 7, rivet: 5 },
} as const;

/** Registration number styled after a private number plate. */
export function PlateBadge({ plate, size = 'md' }: PlateBadgeProps) {
  const metrics = SIZES[size];
  const formatted = formatPlate(plate);

  return (
    <View
      accessible
      accessibilityLabel={formatted.split('').join(' ')}
      style={[
        styles.plate,
        { paddingHorizontal: metrics.paddingHorizontal, paddingVertical: metrics.paddingVertical },
      ]}
    >
      <View style={[styles.rivet, { width: metrics.rivet, height: metrics.rivet, left: 4 }]} />
      <Text
        allowFontScaling={false}
        style={[styles.text, { fontSize: metrics.fontSize, lineHeight: metrics.fontSize * 1.25 }]}
      >
        {formatted}
      </Text>
      <View style={[styles.rivet, { width: metrics.rivet, height: metrics.rivet, right: 4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  rivet: {
    position: 'absolute',
    top: '50%',
    marginTop: -2,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
  },
  text: {
    fontFamily: fonts.heading,
    letterSpacing: 1.4,
    color: colors.ink,
  },
});
