import { useState, type FormEvent } from 'react';
import type { PlannerState } from '../lib/planner-data';
import type {
  AuthState,
  CloudSyncSetterValue,
  NoteDialogState,
  PendingNoteDeletionState,
} from '../app/types';
import { createNote, deleteNote, updateNote } from '../lib/supabase';
import { humanizeAuthError } from '../lib/auth-errors';
import { nextStringId } from '../lib/id';

type UseNoteManagerParams = {
  authState: AuthState;
  plannerState: PlannerState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
};

export function useNoteManager({
  authState,
  plannerState,
  setCloudSync,
  updateState,
}: UseNoteManagerParams) {
  const [noteDialogState, setNoteDialogState] = useState<NoteDialogState | null>(null);
  const [pendingNoteDeletion, setPendingNoteDeletion] = useState<PendingNoteDeletionState | null>(null);
  const [noteDeletionBusy, setNoteDeletionBusy] = useState(false);

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get('title') || '').trim();
    const text = String(form.get('text') || '').trim();

    if (!text) {
      return;
    }

    try {
      if (authState.family) {
        const createdNote = await createNote(authState.family.familyId, { title, text });
        updateState((current) => ({
          ...current,
          notes: [createdNote, ...current.notes],
        }));
        setCloudSync({
          phase: 'ready',
          message: 'Notiz wurde gespeichert.',
        });
      } else {
        updateState((current) => ({
          ...current,
          notes: [{ id: nextStringId(), title, text }, ...current.notes],
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

  const handleDeleteNote = async (noteId: string) => {
    const note = plannerState.notes.find((entry) => entry.id === noteId);
    if (!note) {
      return;
    }
    setPendingNoteDeletion({ id: note.id, title: note.title });
  };

  const handleConfirmNoteDeletion = async () => {
    if (!pendingNoteDeletion) {
      return;
    }
    setNoteDeletionBusy(true);

    try {
      if (authState.family) {
        await deleteNote(pendingNoteDeletion.id);
      }
      updateState((current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== pendingNoteDeletion.id),
      }));
      setNoteDialogState((current) => (current?.id === pendingNoteDeletion.id ? null : current));
      setPendingNoteDeletion(null);
      setCloudSync({
        phase: 'ready',
        message: 'Notiz wurde gelöscht.',
      });
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setNoteDeletionBusy(false);
    }
  };

  const handleOpenNote = (noteId: string) => {
    const note = plannerState.notes.find((entry) => entry.id === noteId);
    if (!note) {
      return;
    }
    setNoteDialogState({ ...note, isEditing: false });
  };

  const handleNoteDialogFieldChange = (field: 'title' | 'text', value: string) => {
    setNoteDialogState((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSaveNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!noteDialogState) {
      return;
    }
    const title = noteDialogState.title.trim();
    const text = noteDialogState.text.trim();

    if (!text) {
      return;
    }

    try {
      let savedNote = { id: noteDialogState.id, title, text };
      if (authState.family) {
        savedNote = await updateNote(noteDialogState.id, { title, text });
        setCloudSync({
          phase: 'ready',
          message: 'Notiz wurde aktualisiert.',
        });
      }
      updateState((current) => ({
        ...current,
        notes: current.notes.map((note) => (note.id === savedNote.id ? savedNote : note)),
      }));
      setNoteDialogState(null);
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  return {
    noteDialogState,
    setNoteDialogState,
    pendingNoteDeletion,
    setPendingNoteDeletion,
    noteDeletionBusy,
    handleAddNote,
    handleDeleteNote,
    handleConfirmNoteDeletion,
    handleOpenNote,
    handleNoteDialogFieldChange,
    handleSaveNote,
  };
}
