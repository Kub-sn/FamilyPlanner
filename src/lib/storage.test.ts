import { afterEach, describe, expect, it } from 'vitest';
import { defaultPlannerState } from './planner-data';
import { loadActiveTab, loadPlannerState, saveActiveTab } from './storage';

describe('loadPlannerState', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('strips legacy note categories from stored planner state', () => {
    window.localStorage.setItem(
      'family-planner-state-v2',
      JSON.stringify({
        ...defaultPlannerState,
        notes: [
          {
            id: 'note-1',
            title: 'Hinweis',
            text: 'Brotdose einpacken',
            tag: 'Schule',
          },
        ],
      }),
    );

    expect(loadPlannerState().notes).toEqual([
      {
        id: 'note-1',
        title: 'Hinweis',
        text: 'Brotdose einpacken',
      },
    ]);
  });

  it('loads and saves the active tab when it is valid', () => {
    saveActiveTab('family');

    expect(loadActiveTab()).toBe('family');
  });

  it('ignores invalid stored active tabs', () => {
    window.localStorage.setItem('family-planner-active-tab-v1', 'not-a-real-tab');

    expect(loadActiveTab()).toBeNull();
  });
});