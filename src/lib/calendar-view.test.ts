import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildCalendarMonth,
  formatCalendarEntrySchedule,
  formatCalendarMonthLabel,
  getCalendarEntryDateKey,
  parseCalendarDateKey,
  sortCalendarEntries,
} from './calendar-view';

describe('calendar-view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('groups structured events into a monday-first month grid', () => {
    vi.setSystemTime(new Date('2026-10-02T08:00:00.000Z'));

    const weeks = buildCalendarMonth(
      new Date(2026, 9, 1),
      [
        { id: '1', title: 'Laternenfest', date: '2026-10-14', time: '18:30', place: 'Schulhof' },
        { id: '2', title: 'Arzt', date: '2026-10-14', time: '09:15', place: 'Praxis' },
      ],
      '2026-10-14',
    );

    expect(weeks).toHaveLength(6);
    expect(weeks[0][0].dateKey).toBe('2026-09-28');

    const selectedDay = weeks.flat().find((day) => day.dateKey === '2026-10-14');

    expect(selectedDay?.isSelected).toBe(true);
    expect(selectedDay?.entries.map((entry) => entry.title)).toEqual(['Arzt', 'Laternenfest']);
  });

  it('keeps legacy entries without a valid date outside the structured day grid', () => {
    expect(getCalendarEntryDateKey({
      id: 'legacy',
      title: 'Elternabend',
      date: 'Freitag nachmittags',
      time: '19:00',
      place: 'Schule',
    })).toBeNull();
  });

  it('formats structured schedule labels for the calendar UI', () => {
    expect(parseCalendarDateKey('2026-10-14')).not.toBeNull();
    expect(formatCalendarMonthLabel(new Date(2026, 9, 1))).toContain('2026');
    expect(formatCalendarEntrySchedule({
      id: '1',
      title: 'Laternenfest',
      date: '2026-10-14',
      time: '18:30',
      place: 'Schulhof',
    })).toContain('18:30');
    expect(sortCalendarEntries([
      { id: '2', title: 'Später', date: '2026-10-14', time: '19:30', place: 'A' },
      { id: '1', title: 'Früher', date: '2026-10-14', time: '09:00', place: 'B' },
    ]).map((entry) => entry.title)).toEqual(['Früher', 'Später']);
  });
});