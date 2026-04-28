import { useState, type FormEvent } from 'react';
import type { PlannerState } from '../../lib/planner-data';
import { useActiveTab } from '../../context/ActiveTabContext';
import { validateRequiredFields, type FieldErrors } from '../../lib/form-validation';
import { FieldError } from './FieldError';

export function TasksModule({
  ownerDefaultValue,
  tasks,
  onAddTask,
  onToggleTask,
}: {
  ownerDefaultValue: string;
  tasks: PlannerState['tasks'];
  onAddTask: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggleTask: (id: string, done: boolean) => Promise<void>;
}) {
  const { activeTab } = useActiveTab();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = new FormData(event.currentTarget);
    const next = validateRequiredFields(form, [
      { name: 'title', label: 'Aufgabe' },
      { name: 'owner', label: 'Verantwortlich' },
      { name: 'due', label: 'Fällig am' },
    ]);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
      setErrors(next);
      return;
    }
    setErrors({});
    void onAddTask(event);
  };

  const clearFieldError = (name: string) =>
    setErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });

  return (
    <section className={activeTab === 'tasks' ? 'module is-visible' : 'module'}>
      <div className="module-layout">
        <form className="panel form-panel" onSubmit={handleSubmit} noValidate>
          <h4>Neue Aufgabe</h4>
          <input
            name="title"
            placeholder="Aufgabe"
            aria-invalid={errors.title ? 'true' : undefined}
            aria-describedby={errors.title ? 'title-error' : undefined}
            onInput={() => clearFieldError('title')}
          />
          <FieldError fieldName="title" message={errors.title} />
          <input
            name="owner"
            placeholder="Verantwortlich"
            defaultValue={ownerDefaultValue}
            aria-invalid={errors.owner ? 'true' : undefined}
            aria-describedby={errors.owner ? 'owner-error' : undefined}
            onInput={() => clearFieldError('owner')}
          />
          <FieldError fieldName="owner" message={errors.owner} />
          <input
            name="due"
            placeholder="Fällig am"
            aria-invalid={errors.due ? 'true' : undefined}
            aria-describedby={errors.due ? 'due-error' : undefined}
            onInput={() => clearFieldError('due')}
          />
          <FieldError fieldName="due" message={errors.due} />
          <button type="submit">Aufgabe speichern</button>
        </form>
        <article className="panel self-start">
          <ul className="task-list">
            {tasks.length > 0 ? tasks.map((task) => (
              <li key={task.id} className={task.done ? 'done' : ''}>
                <button
                  type="button"
                  className="ghost-toggle"
                  onClick={() => void onToggleTask(task.id, !task.done)}
                >
                  {task.done ? 'Erledigt' : 'Offen'}
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {task.owner} · {task.due}
                  </small>
                </div>
              </li>
            )) : null}
            {tasks.length === 0 ? <li className="py-3 text-[rgba(24,52,47,0.55)] italic border-none list-none">Keine Aufgaben vorhanden</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}