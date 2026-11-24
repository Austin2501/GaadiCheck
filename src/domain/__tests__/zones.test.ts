import { ZONES } from '@/domain/zones';

describe('CPCB locations', () => {
  // data.gov.in matches filters exactly and returns no records for a misspelt state or city, which
  // silently drops the district to modelled estimates. The feed spells names with spaces.
  it('uses the feed spelling, with spaces rather than underscores', () => {
    for (const zone of ZONES) {
      expect(zone.cpcb.length).toBeGreaterThan(0);
      for (const { state, city } of zone.cpcb) {
        expect(state).not.toContain('_');
        expect(city).not.toContain('_');
      }
    }
  });
});
