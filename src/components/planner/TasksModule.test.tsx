import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActiveTabProvider } from '../../context/ActiveTabContext';
import { plannerFixture } from './planner-test-fixtures';
import { TasksModule } from './TasksModule';

describe('TasksModule', () => {
  it('renders tasks, submits the form, and toggles completion', async () => {
    const user = userEvent.setup();
    const onAddTask = vi.fn().mockResolvedValue(undefined);
    const onToggleTask = vi.fn().mockResolvedValue(undefined);

    render(
      <ActiveTabProvider activeTab="tasks" setActiveTab={vi.fn()}>
        <TasksModule
          ownerDefaultValue="Alex"
          tasks={plannerFixture.tasks}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
        />
      </ActiveTabProvider>,
    );

    await user.type(screen.getByPlaceholderText('Aufgabe'), 'Muell rausbringen');
    await user.type(screen.getByPlaceholderText('Fällig am'), 'Heute');
    await user.click(screen.getByRole('button', { name: 'Aufgabe speichern' }));
    await user.click(screen.getByRole('button', { name: 'Offen' }));

    expect(onAddTask).toHaveBeenCalled();
    expect(onToggleTask).toHaveBeenCalledWith('task-1', true);
  });
});