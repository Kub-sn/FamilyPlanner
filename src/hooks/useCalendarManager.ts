import { useMemo, useState, type FormEvent } from 'react';
import type { PlannerState } from '../lib/planner-data';
import type { AuthState, CloudSyncSetterValue } from '../app/types';
import {
  buildCalendarMonth,
  getCalendarEntryDateKey,
  getMonthStart,
  parseCalendarDateKey,
  shiftMonth,
  sortCalendarEntries,
  toCalendarDateKey,
} from '../lib/calendar-view';
import { createCalendarEntry } from '../lib/supabase';
import { humanizeAuthError } from '../lib/auth-errors';
import { nextStringId } from '../lib/id';

type UseCalendarManagerParams = {
  authState: AuthState;
  plannerState: PlannerState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
};

export function useCalendarManager({
  authState,
  plannerState,
  setCloudSync,
  updateState,
}: UseCalendarManagerParams) {
  const [calendarViewDate, setCalendarViewDate] = useState(() => getMonthStart(new Date()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => toCalendarDateKey(new Date()));

  const sortedCalendarEntries = useMemo(
    () => sortCalendarEntries(plannerState.calendar),
    [plannerState.calendar],
  );

  const scheduledCalendarEntries = useMemo(
    () => sortedCalendarEntries.filter((entry) => Boolean(getCalendarEntryDateKey(entry))),
    [sortedCalendarEntries],
  );

  const unscheduledCalendarEntries = useMemo(
    () => sortedCalendarEntries.filter((entry) => !getCalendarEntryDateKey(entry)),
    [sortedCalendarEntries],
  );

  const calendarMonth = useMemo(
    () => buildCalendarMonth(calendarViewDate, scheduledCalendarEntries, selectedCalendarDate),
    [calendarViewDate, scheduledCalendarEntries, selectedCalendarDate],
  );

  const visibleMonthEventCount = useMemo(
    () =>
      scheduledCalendarEntries.filter((entry) => {
        const entryDate = parseCalendarDateKey(getCalendarEntryDateKey(entry) ?? '');
        return (
          entryDate?.getFullYear() === calendarViewDate.getFullYear()
          && entryDate.getMonth() === calendarViewDate.getMonth()
        );
      }).length,
    [calendarViewDate, scheduledCalendarEntries],
  );

  const selectedDayEntries = useMemo(
    () =>
      scheduledCalendarEntries.filter((entry) => getCalendarEntryDateKey(entry) === selectedCalendarDate),
    [scheduledCalendarEntries, selectedCalendarDate],
  );

  const handleAddCalendar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get('title') || '').trim();
    const date = String(form.get('date') || '').trim();
    const time = String(form.get('time') || '').trim();
    const place = String(form.get('place') || '').trim();

    if (!title || !date || !time || !place) {
      return;
    }

    try {
      if (authState.family) {
        const createdEntry = await createCalendarEntry(authState.family.familyId, {
          title, date, time, place,
        });
        updateState((current) => ({
          ...current,
          calendar: [createdEntry, ...current.calendar],
        }));
        setCloudSync({
          phase: 'ready',
          message: 'Kalendereintrag wurde gespeichert.',
        });
      } else {
        updateState((current) => ({
          ...current,
          calendar: [{ id: nextStringId(), title, date, time, place }, ...current.calendar],
        }));
      }

      const structuredDate = parseCalendarDateKey(date);
      if (structuredDate) {
        setCalendarViewDate(getMonthStart(structuredDate));
        setSelectedCalendarDate(toCalendarDateKey(structuredDate));
      }
      formElement.reset();
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleShowTodayInCalendar = () => {
    const today = new Date();
    setCalendarViewDate(getMonthStart(today));
    setSelectedCalendarDate(toCalendarDateKey(today));
  };

  const handleChangeCalendarMonth = (amount: number) => {
    const nextMonth = shiftMonth(calendarViewDate, amount);
    setCalendarViewDate(nextMonth);
    setSelectedCalendarDate(toCalendarDateKey(nextMonth));
  };

  return {
    calendarViewDate,
    selectedCalendarDate,
    setSelectedCalendarDate,
    sortedCalendarEntries,
    unscheduledCalendarEntries,
    calendarMonth,
    visibleMonthEventCount,
    selectedDayEntries,
    handleAddCalendar,
    handleShowTodayInCalendar,
    handleChangeCalendarMonth,
  };
}
