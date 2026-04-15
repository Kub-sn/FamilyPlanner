import { defaultPlannerState, tabs, type PlannerState, type TabId } from './planner-data';

const STORAGE_KEY = 'family-planner-state-v2';
const ACTIVE_TAB_STORAGE_KEY = 'family-planner-active-tab-v1';

function isTabId(value: unknown): value is TabId {
  return typeof value === 'string' && tabs.some((tab) => tab.id === value);
}

function normalizePlannerState(state: PlannerState): PlannerState {
  return {
    ...state,
    notes: Array.isArray(state.notes)
      ? state.notes.map((note) => ({
          id: note.id,
          title: note.title,
          text: note.text,
        }))
      : defaultPlannerState.notes,
  };
}

export function loadPlannerState(): PlannerState {
  if (typeof window === 'undefined') {
    return defaultPlannerState;
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY);

  if (!rawState) {
    return defaultPlannerState;
  }

  try {
    return normalizePlannerState(JSON.parse(rawState) as PlannerState);
  } catch {
    return defaultPlannerState;
  }
}

export function savePlannerState(state: PlannerState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadActiveTab(): TabId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);

  if (!rawTab) {
    return null;
  }

  return isTabId(rawTab) ? rawTab : null;
}

export function saveActiveTab(tab: TabId) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
}