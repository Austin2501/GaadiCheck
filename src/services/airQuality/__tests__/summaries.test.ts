import { summarizeCpcbRecords } from '../cpcb';
import { summarizeHourly, type OpenMeteoHourly } from '../openMeteo';

function hourlySeries(start: string, hours: number, pm25: number, pm10: number): OpenMeteoHourly {
  const base = new Date(`${start}:00Z`).getTime();
  const time = Array.from({ length: hours }, (_, index) =>
    new Date(base + index * 3_600_000).toISOString().slice(0, 16),
  );
  return {
    time,
    pm2_5: time.map(() => pm25),
    pm10: time.map(() => pm10),
  };
}

describe('summarizeHourly', () => {
  it('averages the trailing 24 hours and the whole of tomorrow', () => {
    const hourly = hourlySeries('2026-11-21T00:00', 96, 150, 300);
    hourly.time.forEach((time, index) => {
      if (time.startsWith('2026-11-23')) hourly.pm2_5[index] = 45;
      if (time.startsWith('2026-11-23')) hourly.pm10[index] = 60;
    });

    const { current, tomorrow } = summarizeHourly(hourly, new Date('2026-11-22T12:30:00+05:30'));

    expect(current).toMatchObject({
      aqi: 323,
      category: 'very-poor',
      prominent: 'PM2.5',
      source: 'model',
    });
    expect(current?.observedAt).toBe('2026-11-22T12:00:00+05:30');
    expect(tomorrow).toMatchObject({ aqi: 75, category: 'satisfactory' });
  });

  it('withholds a value when too few hours are available', () => {
    const hourly = hourlySeries('2026-11-22T00:00', 10, 80, 120);
    expect(summarizeHourly(hourly, new Date('2026-11-22T09:30:00+05:30')).current).toBeNull();
  });
});

describe('summarizeCpcbRecords', () => {
  it('averages station AQIs that report particulate matter', () => {
    const reading = summarizeCpcbRecords([
      {
        station: 'Anand Vihar',
        pollutant_id: 'PM2.5',
        avg_value: '380',
        last_update: '22-11-2026 18:00:00',
      },
      {
        station: 'Anand Vihar',
        pollutant_id: 'NO2',
        avg_value: '90',
        last_update: '22-11-2026 18:00:00',
      },
      {
        station: 'Loni',
        pollutant_id: 'PM10',
        pollutant_avg: 300,
        last_update: '22-11-2026 17:00:00',
      },
      { station: 'Loni', pollutant_id: 'OZONE', avg_value: 'NA' },
      { station: 'Gas only', pollutant_id: 'CO', avg_value: '120' },
    ]);

    expect(reading).toEqual({
      aqi: 340,
      category: 'very-poor',
      prominent: 'PM2.5',
      source: 'cpcb',
      observedAt: '2026-11-22T18:00:00+05:30',
      stationCount: 2,
    });
  });

  it('returns null when no station reports particulates', () => {
    expect(
      summarizeCpcbRecords([{ station: 'X', pollutant_id: 'CO', avg_value: '50' }]),
    ).toBeNull();
  });
});
