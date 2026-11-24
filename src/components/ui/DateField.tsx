import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { dateToIsoDate, isoDateToDate } from '@/domain/dates';
import type { IsoDate, LanguageCode } from '@/domain/types';
import { formatCalendarDate } from '@/i18n/format';
import { colors, MIN_TOUCH_TARGET, radius, shadows, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';
import { openSystemDatePicker } from './systemDatePicker';

/** An empty field opens on today, kept inside the allowed range. */
function startingDate(minimumDate?: Date, maximumDate?: Date): Date {
  const today = new Date();
  if (maximumDate && today > maximumDate) return maximumDate;
  if (minimumDate && today < minimumDate) return minimumDate;
  return today;
}

interface DateFieldProps {
  label: string;
  value: IsoDate | null;
  onChange: (value: IsoDate | null) => void;
  hint?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DateField({
  label,
  value,
  onChange,
  hint,
  error,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const [sheetDraft, setSheetDraft] = useState<Date | null>(null);
  const initial = value ? isoDateToDate(value) : startingDate(minimumDate, maximumDate);

  const open = () => {
    const handled = openSystemDatePicker({
      value: initial,
      minimumDate,
      maximumDate,
      onPick: (date) => onChange(dateToIsoDate(date)),
    });
    if (!handled) setSheetDraft(initial);
  };

  return (
    <View style={styles.wrapper}>
      <AppText variant="calloutStrong" color={colors.inkMuted}>
        {label}
      </AppText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatCalendarDate(value, language) : t('vehicle.datePlaceholder')}`}
          onPress={open}
          style={({ pressed }) => [
            styles.field,
            error ? styles.invalid : null,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="calendar-outline" color={value ? colors.primary : colors.inkSubtle} />
          <AppText variant="body" color={value ? colors.ink : colors.inkDisabled}>
            {value ? formatCalendarDate(value, language) : t('vehicle.datePlaceholder')}
          </AppText>
        </Pressable>
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vehicle.clearDate')}
            onPress={() => onChange(null)}
            hitSlop={8}
            style={styles.clear}
          >
            <Icon name="close-circle" size={22} color={colors.inkSubtle} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.stop}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.inkSubtle}>
          {hint}
        </AppText>
      ) : null}

      {sheetDraft !== null ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSheetDraft(null)}>
          <Pressable style={styles.backdrop} onPress={() => setSheetDraft(null)}>
            <Pressable style={styles.sheet}>
              <AppText variant="heading">{label}</AppText>
              <DateTimePicker
                value={sheetDraft}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                accentColor={colors.primary}
                onChange={(_, date) => date && setSheetDraft(date)}
              />
              <Button
                label={t('common.continue')}
                onPress={() => {
                  onChange(dateToIsoDate(sheetDraft));
                  setSheetDraft(null);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  invalid: {
    borderColor: colors.stop,
  },
  clear: {
    width: MIN_TOUCH_TARGET - 8,
    height: MIN_TOUCH_TARGET - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadows.raised,
  },
});
