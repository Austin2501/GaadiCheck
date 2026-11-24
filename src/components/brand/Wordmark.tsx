import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { BrandMark } from './BrandMark';

interface WordmarkProps {
  size?: number;
  showMark?: boolean;
  inverse?: boolean;
}

export function Wordmark({ size = 22, showMark = true, inverse = false }: WordmarkProps) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="GaadiCheck">
      {showMark ? <BrandMark size={size * 1.45} variant={inverse ? 'inverse' : 'tile'} /> : null}
      <Text
        style={[styles.text, { fontSize: size, lineHeight: size * 1.2 }]}
        allowFontScaling={false}
      >
        <Text style={{ color: inverse ? colors.inkInverse : colors.ink }}>Gaadi</Text>
        <Text style={{ color: inverse ? colors.accent : colors.primary }}>Check</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontFamily: fonts.display,
    letterSpacing: -0.4,
  },
});
