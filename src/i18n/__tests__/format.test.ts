import { formatCalendarDate, formatRelative, formatRupees } from '../format';

describe('formatRelative', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-22T12:00:00+05:30'));
  });

  afterEach(() => jest.useRealTimers());

  it('keeps Latin digits in Hindi', () => {
    const text = formatRelative(new Date('2026-11-22T09:00:00+05:30'), 'hi');
    expect(text).toMatch(/3/);
    expect(text).not.toMatch(/[०-९]/);
  });

  it('reads naturally in English', () => {
    expect(formatRelative(new Date('2026-11-22T11:00:00+05:30'), 'en')).toBe('1 hour ago');
  });
});

describe('formatCalendarDate', () => {
  it('formats a calendar day in both languages', () => {
    expect(formatCalendarDate('2026-11-25', 'en')).toBe('25 Nov 2026');
    expect(formatCalendarDate('2026-11-25', 'hi')).toMatch(/^25 \S+ 2026$/);
  });
});

describe('formatRupees', () => {
  it('uses Indian grouping without paise', () => {
    expect(formatRupees(20000)).toBe('₹20,000');
  });
});
