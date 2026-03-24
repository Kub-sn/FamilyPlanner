import { defaultPlannerState, type PlannerState } from './planner-data';

const STORAGE_KEY = 'family-planner-state-v2';

export function loadPlannerState(): PlannerState {
  if (typeof window === 'undefined') {
    return defaultPlannerState;
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY);

  if (!rawState) {
    return defaultPlannerState;
  }

  try {
    return JSON.parse(rawState) as PlannerState;
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