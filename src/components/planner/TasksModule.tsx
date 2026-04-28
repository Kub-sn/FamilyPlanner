import type { FormEvent } from 'react';
import type { PlannerState } from '../../lib/planner-data';
import { useActiveTab } from '../../context/ActiveTabContext';

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

  return (
    <section className={activeTab === 'tasks' ? 'module is-visible' : 'module'}>
      <div className="module-layout">
        <form className="panel form-panel" onSubmit={(event) => void onAddTask(event)}>
          <h4>Neue Aufgabe</h4>
          <input name="title" placeholder="Aufgabe" />
          <input name="owner" placeholder="Verantwortlich" defaultValue={ownerDefaultValue} />
          <input name="due" placeholder="Fällig am" />
          <button type="submit">Aufgabe speichern</button>
        </form>
        <article className="panel list-panel">
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