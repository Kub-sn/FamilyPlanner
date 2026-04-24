import {
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type SetStateAction,
  type Dispatch,
} from 'react';
import type { DocumentItem, PlannerState } from '../lib/planner-data';
import type {
  AuthState,
  CloudSyncSetterValue,
  DocumentEditState,
  DocumentFilterKind,
  DocumentPreviewState,
  DocumentSortOption,
  PendingDocumentDeletionState,
} from '../app/types';
import {
  mergeDocumentFiles,
  resolveDocumentMetadata,
  validateSelectedDocumentFiles,
} from '../lib/document-upload';
import {
  createDocument,
  deleteDocument,
  updateDocument,
  uploadDocumentFile,
} from '../lib/supabase';
import { humanizeAuthError, isMissingSingleRowResultError } from '../lib/auth-errors';
import {
  canPreviewDocument,
  compareDocumentLabels,
  getDocumentKind,
} from '../components/planner/planner-shell-utils';
import { nextStringId } from '../lib/id';

function createLocalDocumentLink(file: File) {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file);
  }
  return file.name;
}

function revokeLocalDocumentLink(document: DocumentItem) {
  if (
    document.filePath
    && document.url.startsWith('blob:')
    && typeof URL !== 'undefined'
    && typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(document.url);
  }
}

type UseDocumentManagerParams = {
  authState: AuthState;
  plannerState: PlannerState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
  activeTab: string;
};

export function useDocumentManager({
  authState,
  plannerState,
  setCloudSync,
  updateState,
  activeTab,
}: UseDocumentManagerParams) {
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<File[]>([]);
  const [documentSelectionErrors, setDocumentSelectionErrors] = useState<string[]>([]);
  const [isDocumentDropActive, setIsDocumentDropActive] = useState(false);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [documentKindFilter, setDocumentKindFilter] = useState<DocumentFilterKind>('all');
  const [documentSort, setDocumentSort] = useState<DocumentSortOption>('recent');
  const [documentEditState, setDocumentEditState] = useState<DocumentEditState | null>(null);
  const [documentPreviewState, setDocumentPreviewState] = useState<DocumentPreviewState | null>(null);
  const [pendingDocumentDeletion, setPendingDocumentDeletion] = useState<PendingDocumentDeletionState | null>(null);
  const [documentDeletionBusy, setDocumentDeletionBusy] = useState(false);
  const [documentUploadProgress, setDocumentUploadProgress] = useState<{
    completed: number;
    total: number;
    currentName: string;
  } | null>(null);

  const documentSelectionSummary = documentSelectionErrors.join(' · ');

  const visibleDocuments = useMemo(() => {
    const normalizedSearchTerm = documentSearchTerm.trim().toLowerCase();

    return [...plannerState.documents]
      .filter((document) => {
        if (
          normalizedSearchTerm
          && !document.name.toLowerCase().includes(normalizedSearchTerm)
        ) {
          return false;
        }
        if (documentKindFilter !== 'all' && getDocumentKind(document) !== documentKindFilter) {
          return false;
        }
        return true;
      })
      .sort((left, right) => {
        switch (documentSort) {
          case 'name':
            return compareDocumentLabels(left.name, right.name);
          case 'kind':
            return compareDocumentLabels(getDocumentKind(left), getDocumentKind(right));
          case 'recent':
          default:
            return 0;
        }
      });
  }, [documentKindFilter, documentSearchTerm, documentSort, plannerState.documents]);

  const validateDocumentFiles = (files: File[]) => {
    const validationErrors = validateSelectedDocumentFiles(files);
    if (validationErrors.length > 0) {
      setDocumentSelectionErrors(validationErrors);
      return false;
    }
    setDocumentSelectionErrors([]);
    return true;
  };

  const handleDocumentFileSelection = (files: File[]) => {
    const nextFiles = mergeDocumentFiles(selectedDocumentFiles, files);
    if (nextFiles.length > 0 && !validateDocumentFiles(nextFiles)) {
      return;
    }
    setCloudSync((current) =>
      current.phase === 'error' && current.scope === activeTab
        ? { phase: 'idle', message: null, scope: null }
        : current,
    );
    setSelectedDocumentFiles(nextFiles);
    setIsDocumentDropActive(false);
  };

  const handleDocumentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleDocumentFileSelection(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  };

  const handleDocumentDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleDocumentFileSelection(Array.from(event.dataTransfer.files ?? []));
  };

  const handleDocumentDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDocumentDropActive(true);
  };

  const handleDocumentDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDocumentDropActive(false);
  };

  const handleClearSelectedDocumentFiles = () => {
    setSelectedDocumentFiles([]);
    setDocumentSelectionErrors([]);
  };

  const handleRemoveSelectedDocumentFile = (fileToRemove: File) => {
    setSelectedDocumentFiles((current) =>
      current.filter(
        (file) =>
          !(
            file.name === fileToRemove.name
            && file.size === fileToRemove.size
            && file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
  };

  const handleStartDocumentEdit = (document: DocumentItem) => {
    setDocumentEditState({
      id: document.id,
      name: document.name,
      filePath: document.filePath,
    });
  };

  const handleDocumentEditFieldChange = (
    field: keyof Omit<DocumentEditState, 'id' | 'filePath'>,
    value: string,
  ) => {
    setDocumentEditState((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSaveDocumentEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documentEditState) {
      return;
    }
    const metadata = resolveDocumentMetadata({ name: documentEditState.name });

    try {
      if (authState.family) {
        const updatedDocument = await updateDocument(documentEditState.id, {
          name: metadata.name,
          filePath: documentEditState.filePath,
        });
        updateState((current) => ({
          ...current,
          documents: current.documents.map((document) =>
            document.id === updatedDocument.id ? updatedDocument : document,
          ),
        }));
      } else {
        updateState((current) => ({
          ...current,
          documents: current.documents.map((document) =>
            document.id === documentEditState.id
              ? { ...document, name: metadata.name }
              : document,
          ),
        }));
      }
      setDocumentEditState(null);
      setCloudSync({
        phase: 'ready',
        message: 'Dokument-Metadaten wurden aktualisiert.',
      });
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: isMissingSingleRowResultError(error)
          ? 'Das Dokument konnte nicht gespeichert werden. Prüfe bitte, ob die Datenbank-Migration für Dokument-Bearbeitung bereits ausgeführt wurde.'
          : humanizeAuthError(error),
      });
    }
  };

  const handleOpenDocumentPreview = (document: DocumentItem) => {
    if (!document.url || !canPreviewDocument(document)) {
      return;
    }
    setDocumentPreviewState({
      id: document.id,
      name: document.name,
      url: document.url,
      kind: getDocumentKind(document) === 'image' ? 'image' : 'pdf',
    });
  };

  const handleDeleteDocument = async (document: DocumentItem) => {
    setPendingDocumentDeletion(document);
  };

  const handleConfirmDocumentDeletion = async () => {
    if (!pendingDocumentDeletion) {
      return;
    }
    setDocumentDeletionBusy(true);

    try {
      if (authState.family) {
        await deleteDocument(pendingDocumentDeletion.id, pendingDocumentDeletion.filePath || undefined);
      } else {
        revokeLocalDocumentLink(pendingDocumentDeletion);
      }
      updateState((current) => ({
        ...current,
        documents: current.documents.filter((entry) => entry.id !== pendingDocumentDeletion.id),
      }));
      setDocumentEditState((current) => (current?.id === pendingDocumentDeletion.id ? null : current));
      setDocumentPreviewState((current) => (current?.id === pendingDocumentDeletion.id ? null : current));
      setPendingDocumentDeletion(null);
      setCloudSync({
        phase: 'ready',
        message: 'Dokument wurde gelöscht.',
      });
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setDocumentDeletionBusy(false);
    }
  };

  const handleAddDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const fileInput = form.get('file');
    const selectedFiles =
      selectedDocumentFiles.length > 0
        ? selectedDocumentFiles
        : fileInput instanceof File && fileInput.size > 0
          ? [fileInput]
          : [];

    if (selectedFiles.length === 0) {
      setCloudSync({
        phase: 'error',
        message: 'Bitte mindestens eine Datei angeben.',
      });
      return;
    }

    if (selectedFiles.length > 0 && !authState.family && plannerState.storageMode !== 'local') {
      setCloudSync({
        phase: 'error',
        message: 'Datei-Uploads sind nur verfügbar, wenn du angemeldet bist und zu einer Familie gehörst.',
      });
      return;
    }

    if (selectedFiles.length > 0 && !validateDocumentFiles(selectedFiles)) {
      return;
    }

    try {
      if (authState.family) {
        if (selectedFiles.length > 0) {
          const createdDocuments: DocumentItem[] = [];
          for (const [index, file] of selectedFiles.entries()) {
            setDocumentUploadProgress({
              completed: index,
              total: selectedFiles.length,
              currentName: file.name,
            });
            const uploadedFile = await uploadDocumentFile(authState.family.familyId, file);
            const metadata = resolveDocumentMetadata({ name: '', file });
            const createdDocument = await createDocument(authState.family.familyId, {
              name: metadata.name,
              filePath: uploadedFile.filePath,
            });
            createdDocuments.push(createdDocument);
          }
          updateState((current) => ({
            ...current,
            documents: [...createdDocuments.reverse(), ...current.documents],
          }));
        }
        setCloudSync({
          phase: 'ready',
          message:
            selectedFiles.length > 1
              ? `${selectedFiles.length} Dokumente wurden gespeichert.`
              : 'Dokument wurde gespeichert.',
        });
      } else {
        const createdDocuments = selectedFiles.map((file) => {
          const metadata = resolveDocumentMetadata({ name: '', file });
          return {
            id: nextStringId(),
            name: metadata.name,
            filePath: file.name,
            url: createLocalDocumentLink(file),
          } satisfies DocumentItem;
        });
        updateState((current) => ({
          ...current,
          documents: [...createdDocuments.reverse(), ...current.documents],
        }));
      }
      formElement.reset();
      setSelectedDocumentFiles([]);
      setDocumentSelectionErrors([]);
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setDocumentUploadProgress(null);
    }
  };

  return {
    // State
    selectedDocumentFiles,
    documentSelectionErrors,
    documentSelectionSummary,
    isDocumentDropActive,
    documentSearchTerm,
    documentKindFilter,
    documentSort,
    documentEditState,
    documentPreviewState,
    pendingDocumentDeletion,
    documentDeletionBusy,
    documentUploadProgress,
    visibleDocuments,

    // Setters
    setDocumentSearchTerm,
    setDocumentKindFilter,
    setDocumentSort,
    setDocumentEditState,
    setDocumentPreviewState,
    setPendingDocumentDeletion,

    // Handlers
    handleDocumentInputChange,
    handleDocumentDrop,
    handleDocumentDragOver,
    handleDocumentDragLeave,
    handleClearSelectedDocumentFiles,
    handleRemoveSelectedDocumentFile,
    handleStartDocumentEdit,
    handleDocumentEditFieldChange,
    handleSaveDocumentEdit,
    handleOpenDocumentPreview,
    handleDeleteDocument,
    handleConfirmDocumentDeletion,
    handleAddDocument,
  };
}
