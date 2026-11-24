import { dateToIsoDate, isIsoDate, isoDateToDate } from '@/domain/dates';

import type { DatePickerRequest } from './systemDatePicker';

export type { DatePickerRequest };

let activeInput: HTMLInputElement | null = null;

/**
 * Browsers have a native date dialog behind `<input type="date">`. A detached input can't open
 * it, so a hidden one is attached for the lifetime of the dialog. Browsers don't reliably report
 * a dismissed dialog, so a stale input is cleared on the next open instead.
 */
export function openSystemDatePicker({
  value,
  minimumDate,
  maximumDate,
  onPick,
}: DatePickerRequest): boolean {
  activeInput?.remove();

  const input = document.createElement('input');
  input.type = 'date';
  input.value = dateToIsoDate(value);
  if (minimumDate) input.min = dateToIsoDate(minimumDate);
  if (maximumDate) input.max = dateToIsoDate(maximumDate);
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  Object.assign(input.style, {
    position: 'fixed',
    left: '50%',
    bottom: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
  });

  input.addEventListener(
    'change',
    () => {
      if (isIsoDate(input.value)) onPick(isoDateToDate(input.value));
      input.remove();
      if (activeInput === input) activeInput = null;
    },
    { once: true },
  );

  document.body.appendChild(input);
  activeInput = input;

  try {
    input.showPicker();
  } catch {
    // Older browsers and cross-origin frames: focusing still opens the control.
    input.focus();
    input.click();
  }
  return true;
}
