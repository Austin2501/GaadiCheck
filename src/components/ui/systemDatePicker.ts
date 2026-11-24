import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export interface DatePickerRequest {
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onPick: (date: Date) => void;
}

/**
 * Opens the platform's own date dialog where one exists. Returns false when the caller has to
 * present its own picker, which is the case on iOS where the picker is an inline view.
 */
export function openSystemDatePicker({
  value,
  minimumDate,
  maximumDate,
  onPick,
}: DatePickerRequest): boolean {
  if (Platform.OS !== 'android') return false;

  DateTimePickerAndroid.open({
    value,
    mode: 'date',
    minimumDate,
    maximumDate,
    onChange: (event, date) => {
      if (event.type === 'set' && date) onPick(date);
    },
    onError: (error) => {
      console.warn('Date picker failed to open', error);
    },
  });
  return true;
}
