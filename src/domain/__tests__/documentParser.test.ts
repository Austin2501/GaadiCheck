import { parseDocumentDate, parsePucText, parseRcText } from '@/domain/documentParser';

describe('parseDocumentDate', () => {
  it.each([
    ['27-Apr-2030', '2030-04-27'],
    ['27 APRIL 2030', '2030-04-27'],
    ['05/11/2026', '2026-11-05'],
    ['5-11-2026', '2026-11-05'],
    ['2026-11-05', '2026-11-05'],
  ])('%s → %s', (input, expected) => {
    expect(parseDocumentDate(input)).toBe(expected);
  });

  it('rejects impossible dates', () => {
    expect(parseDocumentDate('31-02-2026')).toBeNull();
    expect(parseDocumentDate('12-Foo-2026')).toBeNull();
  });
});

describe('parseRcText', () => {
  it('reads an RC status screen where values sit beside labels', () => {
    const lines = [
      'Registration No: UP14 DT 4521',
      'Registration Date: 12-Mar-2016',
      'Vehicle Class: MOTOR CAR (LMV)',
      'Fuel Type: DIESEL',
      'Fuel Norms: BHARAT STAGE IV',
    ];

    expect(parseRcText(lines)).toEqual({
      plate: 'UP14DT4521',
      registrationDate: '2016-03-12',
      vehicleType: 'car',
      fuel: 'diesel',
      bsNorm: 4,
    });
  });

  it('copes with values split onto the next line', () => {
    const lines = [
      'Fuel Norms',
      'BHARAT STAGE VI',
      'Fuel',
      'PETROL/CNG',
      'Reg. Date',
      '02/09/2022',
    ];

    expect(parseRcText(lines)).toMatchObject({
      bsNorm: 6,
      fuel: 'cng',
      registrationDate: '2022-09-02',
    });
  });

  it('recognises two-wheelers and electric vehicles', () => {
    expect(
      parseRcText(['Vehicle Class: M-Cycle/Scooter(2WN)', 'Fuel: ELECTRIC(BOV)']),
    ).toMatchObject({
      vehicleType: 'two-wheeler',
      fuel: 'electric',
    });
  });
});

describe('parsePucText', () => {
  it('prefers the labelled validity date', () => {
    const lines = [
      'POLLUTION UNDER CONTROL CERTIFICATE',
      'Registration No. DL 8C AF 5030',
      'Date: 10/11/2026',
      'Validity Upto: 09/05/2027',
    ];

    expect(parsePucText(lines)).toEqual({ plate: 'DL8CAF5030', validUntil: '2027-05-09' });
  });

  it('falls back to the latest date on the certificate', () => {
    expect(parsePucText(['Test date 01-Jun-2026', 'Upto 30-Nov-2026'])).toEqual({
      validUntil: '2026-11-30',
    });
  });
});
