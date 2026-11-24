import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { formatPlate } from '@/domain/registration';
import type { Vehicle } from '@/domain/types';
import { colors, MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

interface VehicleSwitcherProps {
  vehicles: Vehicle[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function VehicleSwitcher({ vehicles, activeId, onSelect }: VehicleSwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {vehicles.map((vehicle) => {
        const active = vehicle.id === activeId;
        const label = vehicle.nickname ?? formatPlate(vehicle.plate);
        return (
          <Pressable
            key={vehicle.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelect(vehicle.id);
            }}
            style={[styles.chip, active && styles.active]}
          >
            <AppText variant="calloutStrong" color={active ? colors.onPrimary : colors.ink}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  chip: {
    minHeight: MIN_TOUCH_TARGET - 8,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
});
