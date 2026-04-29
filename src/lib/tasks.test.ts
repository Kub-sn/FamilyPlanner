import { describe, expect, it } from 'vitest';
import { formatTaskDueLabel, getTaskDueState, getTaskSubtaskProgress, isTaskDone } from './tasks';

describe('task helpers', () => {
  it('detects done tasks from their status', () => {
    expect(isTaskDone({ status: 'done' })).toBe(true);
    expect(isTaskDone({ status: 'todo' })).toBe(false);
  });

  it('computes subtask progress', () => {
    expect(getTaskSubtaskProgress([
      { id: 'a', title: 'One', done: true },
      { id: 'b', title: 'Two', done: false },
    ])).toEqual({ completed: 1, total: 2 });
  });

  it('classifies due dates as soon and overdue', () => {
    const referenceDate = new Date('2026-04-29T09:00:00');

    expect(getTaskDueState('2026-04-30', referenceDate)).toBe('soon');
    expect(getTaskDueState('2026-04-29', referenceDate)).toBe('overdue');
    expect(getTaskDueState('2026-05-10', referenceDate)).toBe('normal');
    expect(getTaskDueState('Heute', referenceDate)).toBe('unknown');
  });

  it('formats ISO due dates for display', () => {
    expect(formatTaskDueLabel('2026-04-29')).toBe('29.04.2026');
    expect(formatTaskDueLabel('Heute')).toBe('Heute');
  });
});