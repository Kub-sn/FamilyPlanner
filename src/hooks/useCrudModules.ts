import type { FormEvent } from 'react';
import type { PlannerState, TaskItem, TaskStatus } from '../lib/planner-data';
import type { AuthState, CloudSyncSetterValue } from '../app/types';
import {
  createShoppingItem,
  createTask,
  deleteTask,
  createMeal,
  updateShoppingItemChecked,
  updateTask,
  updateMealPrepared,
} from '../lib/supabase';
import { humanizeAuthError } from '../lib/auth-errors';
import { nextStringId } from '../lib/id';

type UseCrudModulesParams = {
  authState: AuthState;
  plannerState: PlannerState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
};

export function useCrudModules({
  authState,
  plannerState,
  setCloudSync,
  updateState,
}: UseCrudModulesParams) {
  const handleAddShopping = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get('name') || '').trim();
    const quantity = String(form.get('quantity') || '').trim();
    const category = String(form.get('category') || '').trim();

    if (!name || !quantity || !category) {
      return;
    }

    try {
      if (authState.family) {
        const createdItem = await createShoppingItem(authState.family.familyId, {
          name, quantity, category, checked: false,
        });
        updateState((current) => ({
          ...current,
          shoppingItems: [createdItem, ...current.shoppingItems],
        }));
        setCloudSync({
          phase: 'ready',
          message: 'Neuer Einkaufsartikel wurde gespeichert.',
        });
      } else {
        updateState((current) => ({
          ...current,
          shoppingItems: [
            { id: nextStringId(), name, quantity, category, checked: false },
            ...current.shoppingItems,
          ],
        }));
      }
      formElement.reset();
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleToggleShopping = async (id: string, checked: boolean) => {
    try {
      if (authState.family) {
        await updateShoppingItemChecked(id, checked);
      }
      updateState((current) => ({
        ...current,
        shoppingItems: current.shoppingItems.map((entry) =>
          entry.id === id ? { ...entry, checked } : entry,
        ),
      }));
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleAddTask = async (payload: Omit<TaskItem, 'id' | 'status'>) => {
    if (!payload.title || !payload.owner || !payload.due) {
      return false;
    }

    try {
      if (authState.family) {
        const createdTask = await createTask(authState.family.familyId, {
          title: payload.title,
          owner: payload.owner,
          due: payload.due,
          status: 'todo',
          subtasks: payload.subtasks,
        });
        updateState((current) => ({
          ...current,
          tasks: [createdTask, ...current.tasks],
        }));
        setCloudSync({
          phase: 'ready',
          message: 'Neue Aufgabe wurde gespeichert.',
        });
      } else {
        updateState((current) => ({
          ...current,
          tasks: [{ id: nextStringId(), title: payload.title, owner: payload.owner, due: payload.due, status: 'todo', subtasks: payload.subtasks }, ...current.tasks],
        }));
      }
      return true;
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
      return false;
    }
  };

  const handleUpdateTask = async (id: string, payload: Partial<Omit<TaskItem, 'id'>>) => {
    const currentTask = plannerState.tasks.find((entry) => entry.id === id) ?? null;

    if (!currentTask) {
      return false;
    }

    try {
      if (authState.family) {
        await updateTask(id, payload);
      }
      updateState((current) => ({
        ...current,
        tasks: current.tasks.map((entry) => (
          entry.id === id ? { ...entry, ...payload } : entry
        )),
      }));
      return true;
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
      return false;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      if (authState.family) {
        await deleteTask(id);
      }
      updateState((current) => ({
        ...current,
        tasks: current.tasks.filter((entry) => entry.id !== id),
      }));
      return true;
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
      return false;
    }
  };

  const handleSetTaskStatus = async (id: string, status: TaskStatus) => {
    const currentTask = plannerState.tasks.find((entry) => entry.id === id) ?? null;

    if (!currentTask) {
      return;
    }

    const nextSubtasks = status === 'done'
      ? currentTask.subtasks.map((subtask) => ({ ...subtask, done: true }))
      : currentTask.subtasks;

    try {
      if (authState.family) {
        await updateTask(id, { status, subtasks: nextSubtasks });
      }
      updateState((current) => ({
        ...current,
        tasks: current.tasks.map((entry) =>
          entry.id === id
            ? { ...entry, status, subtasks: nextSubtasks }
            : entry,
        ),
      }));
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleToggleTask = async (id: string, done: boolean) => {
    await handleSetTaskStatus(id, done ? 'done' : 'todo');
  };

  const handleToggleTaskSubtask = async (taskId: string, subtaskId: string, done: boolean) => {
    const currentTask = plannerState.tasks.find((entry) => entry.id === taskId) ?? null;

    if (!currentTask) {
      return;
    }

    const nextSubtasks = currentTask.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, done } : subtask,
    );
    const nextStatus = currentTask.status === 'done' && !done ? 'in-progress' : currentTask.status;

    try {
      if (authState.family) {
        await updateTask(taskId, { subtasks: nextSubtasks, status: nextStatus });
      }
      updateState((current) => ({
        ...current,
        tasks: current.tasks.map((entry) =>
          entry.id === taskId
            ? { ...entry, status: nextStatus, subtasks: nextSubtasks }
            : entry,
        ),
      }));
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleAddMeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const day = String(form.get('day') || '').trim();
    const meal = String(form.get('meal') || '').trim();

    if (!day || !meal) {
      return;
    }

    try {
      if (authState.family) {
        const createdMeal = await createMeal(authState.family.familyId, {
          day, meal, prepared: false,
        });
        updateState((current) => ({
          ...current,
          meals: [createdMeal, ...current.meals],
        }));
        setCloudSync({
          phase: 'ready',
          message: 'Gericht wurde gespeichert.',
        });
      } else {
        updateState((current) => ({
          ...current,
          meals: [{ id: nextStringId(), day, meal, prepared: false }, ...current.meals],
        }));
      }
      formElement.reset();
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleToggleMealPrepared = async (id: string, prepared: boolean) => {
    try {
      if (authState.family) {
        await updateMealPrepared(id, prepared);
      }
      updateState((current) => ({
        ...current,
        meals: current.meals.map((entry) => (entry.id === id ? { ...entry, prepared } : entry)),
      }));
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  return {
    handleAddShopping,
    handleToggleShopping,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    handleToggleTask,
    handleSetTaskStatus,
    handleToggleTaskSubtask,
    handleAddMeal,
    handleToggleMealPrepared,
  };
}
