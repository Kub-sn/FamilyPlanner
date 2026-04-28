import { Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import type { PlannerState } from '../../lib/planner-data';
import { useActiveTab } from '../../context/ActiveTabContext';

export function NotesModule({
  notes,
  onAddNote,
  onDeleteNote,
  onOpenNote,
}: {
  notes: PlannerState['notes'];
  onAddNote: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onOpenNote: (noteId: string) => void;
}) {
  const { activeTab } = useActiveTab();

  return (
    <section className={activeTab === 'notes' ? 'module is-visible' : 'module'}>
      <div className="module-layout notes-module-layout">
        <form className="panel form-panel notes-form-panel" onSubmit={(event) => void onAddNote(event)}>
          <h4>Neue Notiz</h4>
          <input name="title" placeholder="Titel" />
          <textarea name="text" placeholder="Inhalt" rows={5} />
          <button type="submit">Notiz speichern</button>
        </form>
        <article className="panel masonry-panel">
          <div className="columns-2 gap-x-[1.15rem] max-[720px]:columns-1">
            {notes.length > 0 ? notes.map((note) => (
              <article key={note.id} className="note-card break-inside-avoid relative grid mb-4 p-0 w-full max-w-full max-h-[15rem] overflow-hidden rounded-[24px] bg-[rgba(255,248,239,0.92)]">
                <button
                  type="button"
                  className="absolute top-[0.85rem] right-[0.85rem] z-[1] inline-flex items-center justify-center min-w-[2.35rem] min-h-[2.35rem] p-[0.35rem] mb-[0.6rem] rounded-full bg-[#db8e95] text-white leading-none hover:bg-[#d27d85] [&_svg]:w-4 [&_svg]:h-4"
                  aria-label={`Notiz ${note.title} löschen`}
                  onClick={() => void onDeleteNote(note.id)}
                >
                  <Trash2 aria-hidden="true" size={16} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className="appearance-none grid gap-3 w-full p-4 border-none bg-transparent text-left cursor-pointer pt-[1.2rem] pr-[4.3rem] max-[560px]:pt-[1.35rem] max-[560px]:pr-[4.75rem]"
                  onClick={() => onOpenNote(note.id)}
                  aria-label={`Notiz ${note.title} öffnen`}
                >
                  <h4 className="m-0 pt-0 pr-0 [overflow-wrap:anywhere] break-words hyphens-auto line-clamp-2">{note.title}</h4>
                  <p className="m-0 leading-[1.6] [overflow-wrap:anywhere] break-words hyphens-auto line-clamp-5">{note.text}</p>
                </button>
              </article>
            )) : null}
            {notes.length === 0 ? <p className="empty-state-text">Keine Notizen vorhanden</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}