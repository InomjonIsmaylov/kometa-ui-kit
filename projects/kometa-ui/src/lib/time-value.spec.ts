import { dateAt, fromHhMm, fromIsoDate, toHhMm, toIsoDate } from './time-value';

/*
 * The pickers speak Date; the wire and every signal in these apps speak "14:00" and "2026-09-14".
 * LOCAL parts on purpose: a UTC conversion moves "2026-09-14" to the 13th for any browser west of
 * Greenwich, and a time-only value has no date to be "correct" about at all.
 */
describe('time-value', () => {
  it('round-trips a time of day', () => {
    expect(toHhMm(fromHhMm('09:05'))).toBe('09:05');
    expect(toHhMm(dateAt(14, 30))).toBe('14:30');
  });

  it('reads a server TimeOnly with seconds', () => {
    expect(toHhMm(fromHhMm('18:30:00'))).toBe('18:30');
  });

  it('says nothing for nothing', () => {
    expect(fromHhMm('')).toBeNull();
    expect(fromHhMm('nonsense')).toBeNull();
    expect(toHhMm(null)).toBe('');
    expect(fromIsoDate(null)).toBeNull();
    expect(toIsoDate(null)).toBeNull();
  });

  it('round-trips a calendar date in local time', () => {
    const d = fromIsoDate('2026-09-14')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 14]);
    expect(toIsoDate(d)).toBe('2026-09-14');
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
