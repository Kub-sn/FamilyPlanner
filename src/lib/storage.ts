import { defaultPlannerState, tabs, type PlannerState, type TabId, type TaskStatus } from './planner-data';

const STORAGE_KEY = 'family-planner-state-v2';
const ACTIVE_TAB_STORAGE_KEY = 'family-planner-active-tab-v1';

function isTabId(value: unknown): value is TabId {
  return typeof value === 'string' && tabs.some((tab) => tab.id === value);
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'in-progress' || value === 'done';
}

function normalizeTaskSubtasks(subtasks: unknown): PlannerState['tasks'][number]['subtasks'] {
  if (!Array.isArray(subtasks)) {
    return [];
  }

  return subtasks.flatMap((subtask) => {
    if (!subtask || typeof subtask !== 'object') {
      return [];
    }

    const candidate = subtask as Partial<PlannerState['tasks'][number]['subtasks'][number]>;
    const id = typeof candidate.id === 'string' ? candidate.id : '';
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';

    if (!id || !title) {
      return [];
    }

    return [{
      id,
      title,
      done: Boolean(candidate.done),
    }];
  });
}

function normalizeTasks(tasks: unknown): PlannerState['tasks'] {
  if (!Array.isArray(tasks)) {
    return defaultPlannerState.tasks;
  }

  return tasks.flatMap((task) => {
    if (!task || typeof task !== 'object') {
      return [];
    }

    const candidate = task as Partial<PlannerState['tasks'][number]> & { done?: boolean };
    const id = typeof candidate.id === 'string' ? candidate.id : '';
    const title = typeof candidate.title === 'string' ? candidate.title : '';
    const owner = typeof candidate.owner === 'string' ? candidate.owner : '';
    const due = typeof candidate.due === 'string' ? candidate.due : '';
    const status = isTaskStatus(candidate.status)
      ? candidate.status
      : candidate.done
        ? 'done'
        : 'todo';

    if (!id || !title || !owner || !due) {
      return [];
    }

    return [{
      id,
      title,
      owner,
      due,
      status,
      subtasks: normalizeTaskSubtasks(candidate.subtasks),
    }];
  });
}

function normalizePlannerState(state: PlannerState): PlannerState {
  return {
    ...state,
    tasks: normalizeTasks(state.tasks),
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