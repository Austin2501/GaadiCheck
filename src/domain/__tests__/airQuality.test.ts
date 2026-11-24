import {
  categoryForAqi,
  computeIndianAqi,
  indicativeStageForAqi,
  meanOf,
  subIndex,
} from '@/domain/airQuality';

describe('subIndex', () => {
  it.each([
    [0, 0],
    [30, 50],
    [31, 51],
    [45, 75],
    [60, 100],
    [250, 400],
    [600, 500],
  ])('PM2.5 %d µg/m³ → %d', (concentration, expected) => {
    expect(subIndex('pm25', concentration)).toBe(expected);
  });

  it('snaps readings that fall between published bands to the upper band', () => {
    expect(subIndex('pm25', 30.5)).toBe(51);
  });

  it('handles PM10 bands', () => {
    expect(subIndex('pm10', 75)).toBe(75);
    expect(subIndex('pm10', 200)).toBe(167);
  });

  it('ignores missing or invalid readings', () => {
    expect(subIndex('pm25', null)).toBeNull();
    expect(subIndex('pm25', -4)).toBeNull();
    expect(subIndex('pm10', Number.NaN)).toBeNull();
  });
});

describe('computeIndianAqi', () => {
  it('takes the worst sub-index as the AQI', () => {
    expect(computeIndianAqi({ pm25: 150, pm10: 300 })).toEqual({
      aqi: 323,
      category: 'very-poor',
      prominent: 'pm25',
    });
  });

  it('works with a single pollutant and returns null with none', () => {
    expect(computeIndianAqi({ pm10: 120 })?.prominent).toBe('pm10');
    expect(computeIndianAqi({})).toBeNull();
  });
});

describe('helpers', () => {
  it('categorises AQI values', () => {
    expect(categoryForAqi(50)).toBe('good');
    expect(categoryForAqi(301)).toBe('very-poor');
    expect(categoryForAqi(401)).toBe('severe');
  });

  it('requires a minimum number of samples for an average', () => {
    expect(meanOf([10, 20, null, 30], 3)).toBe(20);
    expect(meanOf([10, null], 2)).toBeNull();
  });

  it('maps AQI bands to indicative GRAP stages', () => {
    expect(indicativeStageForAqi(180)).toBe(0);
    expect(indicativeStageForAqi(250)).toBe(1);
    expect(indicativeStageForAqi(380)).toBe(2);
    expect(indicativeStageForAqi(420)).toBe(3);
    expect(indicativeStageForAqi(470)).toBe(4);
  });
});
