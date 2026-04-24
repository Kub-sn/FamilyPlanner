import { useState, type FormEvent } from 'react';
import type { PlannerState } from '../lib/planner-data';
import type { AuthState, CloudSyncSetterValue } from '../app/types';
import {
  createShoppingItem,
  createTask,
  createMeal,
  updateShoppingItemChecked,
  updateTaskDone,
  updateMealPrepared,
} from '../lib/supabase';
import { humanizeAuthError } from '../lib/auth-errors';
import { nextStringId } from '../lib/id';

type UseCrudModulesParams = {
  authState: AuthState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
};

export function useCrudModules({
  authState,
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

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get('title') || '').trim();
    const owner = String(form.get('owner') || '').trim();
    const due = String(form.get('due') || '').trim();

    if (!title || !owner || !due) {
      return;
    }

    try {
      if (authState.family) {
        const createdTask = await createTask(authState.family.familyId, {
          title, owner, due, done: false,
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
          tasks: [{ id: nextStringId(), title, owner, due, done: false }, ...current.tasks],
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

  const handleToggleTask = async (id: string, done: boolean) => {
    try {
      if (authState.family) {
        await updateTaskDone(id, done);
      }
      updateState((current) => ({
        ...current,
        tasks: current.tasks.map((entry) => (entry.id === id ? { ...entry, done } : entry)),
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
    handleToggleTask,
    handleAddMeal,
    handleToggleMealPrepared,
  };
}
