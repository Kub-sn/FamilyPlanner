import type { DocumentFilterKind, DocumentSortOption } from '../../app/types';
import type { PlannerState } from '../../lib/planner-data';
import type { AuthState, CloudSyncSetterValue } from '../../app/types';
import {
  canPreviewDocument,
  DOCUMENT_KIND_FILTER_OPTIONS,
  DOCUMENT_SORT_OPTIONS,
  getDocumentIcon,
  getDocumentMetaParts,
  isPreviewableImage,
} from './planner-shell-utils';
import { useActiveTab } from '../../context/ActiveTabContext';
import { useDocumentManager } from '../../hooks/useDocumentManager';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DocumentEditModal } from './DocumentEditModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

export function DocumentsModule({
  authState,
  plannerState,
  setCloudSync,
  updateState,
}: {
  authState: AuthState;
  plannerState: PlannerState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
}) {
  const { activeTab } = useActiveTab();

  const documents = useDocumentManager({
    authState,
    plannerState,
    setCloudSync,
    updateState,
    activeTab,
  });
  return (
    <section className={activeTab === 'documents' ? 'module is-visible' : 'module'}>
      {documents.documentSelectionErrors.length > 0 ? (
        <div
          className="auth-feedback auth-error module-feedback module-feedback-compact"
          aria-live="polite"
          title={documents.documentSelectionSummary}
        >
          <strong>Dateiauswahl prüfen</strong>
          <p className="document-error-preview">{documents.documentSelectionSummary}</p>
        </div>
      ) : null}
      <div className="module-layout document-module-layout">
        <form className="panel form-panel document-form-panel" onSubmit={(event) => void documents.handleAddDocument(event)}>
          <h4>Dokument erfassen</h4>
          <label
            className={documents.isDocumentDropActive ? 'file-input-label is-drag-active' : 'file-input-label'}
            onDrop={documents.handleDocumentDrop}
            onDragOver={documents.handleDocumentDragOver}
            onDragLeave={documents.handleDocumentDragLeave}
          >
            <span>Datei hochladen</span>
            <small>
              PDF, Bilder, Word-Dateien oder mehrere Dateien hier hineinziehen. Maximal
              erlaubt sind 15 MB pro Datei.
            </small>
            <input
              name="file"
              type="file"
              accept="application/pdf,image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={documents.handleDocumentInputChange}
            />
          </label>
          {documents.selectedDocumentFiles.length > 0 ? (
            <div className="selected-file-list">
              <div className="selected-file-summary">
                <strong>{documents.selectedDocumentFiles.length} Datei(en) ausgewählt</strong>
                <button type="button" className="secondary-action" onClick={documents.handleClearSelectedDocumentFiles}>
                  Auswahl leeren
                </button>
              </div>
              {documents.selectedDocumentFiles.map((file) => (
                <div key={`${file.name}-${file.size}`} className="selected-file-card">
                  <div>
                    <strong>{file.name}</strong>
                    <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                  </div>
                  <button
                    type="button"
                    className="secondary-action selected-file-remove"
                    onClick={() => documents.handleRemoveSelectedDocumentFile(file)}
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {documents.documentUploadProgress ? (
            <div className="upload-progress-card" aria-live="polite">
              <strong>
                Upload {documents.documentUploadProgress.completed + 1} von {documents.documentUploadProgress.total}
              </strong>
              <small>{documents.documentUploadProgress.currentName}</small>
              <div className="upload-progress-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.max(
                      8,
                      Math.round((documents.documentUploadProgress.completed / documents.documentUploadProgress.total) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
          <button type="submit">Dokument speichern</button>
        </form>
        <article className="panel list-panel">
          <div className="document-toolbar">
            <div className="document-toolbar-copy">
              <strong>{documents.visibleDocuments.length} {documents.visibleDocuments.length === 1 ? 'Dokument' : 'Dokumente'} sichtbar</strong>
              <small>{plannerState.documents.length} insgesamt</small>
            </div>
            <div className="document-filter-grid">
              <input
                aria-label="Dokumente suchen"
                placeholder="Dokumente suchen"
                value={documents.documentSearchTerm}
                onChange={(event) => documents.setDocumentSearchTerm(event.currentTarget.value)}
              />
              <select
                aria-label="Dokumenttyp filtern"
                value={documents.documentKindFilter}
                onChange={(event) => documents.setDocumentKindFilter(event.currentTarget.value as DocumentFilterKind)}
              >
                {DOCUMENT_KIND_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Dokumente sortieren"
                value={documents.documentSort}
                onChange={(event) => documents.setDocumentSort(event.currentTarget.value as DocumentSortOption)}
              >
                {DOCUMENT_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ul className="document-list document-grid">
            {documents.visibleDocuments.length > 0 ? (
              documents.visibleDocuments.map((document) => (
                <li key={document.id}>
                  <div>
                    <div className="document-entry-head">
                      {isPreviewableImage(document) ? (
                        <img className="document-preview" src={document.url} alt={`Vorschau für ${document.name}`} />
                      ) : (
                        <span className="document-icon" aria-hidden="true">
                          {getDocumentIcon(document)}
                        </span>
                      )}
                      <div className="document-entry-copy">
                        <strong>{document.name}</strong>
                        <small className="document-meta-line">
                          {getDocumentMetaParts(document).map((part, index) => (
                            <span key={part.key} className={`document-meta-part document-meta-part-${part.tone}`}>
                              {index > 0 ? <span className="document-meta-separator"> · </span> : null}
                              <span>{part.value}</span>
                            </span>
                          ))}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="document-actions">
                    {document.url ? (
                      <a className="auth-submit document-action-button document-link-button document-open-button" href={document.url} target="_blank" rel="noreferrer">
                        Datei öffnen
                      </a>
                    ) : null}
                    {canPreviewDocument(document) && document.url ? (
                      <button
                        type="button"
                        className="auth-submit document-action-button document-preview-button"
                        aria-label={`Dokument ${document.name} in Vorschau öffnen`}
                        onClick={() => documents.handleOpenDocumentPreview(document)}
                      >
                        Vorschau
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="auth-submit document-action-button document-edit-button"
                      aria-label={`Dokument ${document.name} bearbeiten`}
                      onClick={() => documents.handleStartDocumentEdit(document)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="secondary-action document-delete-button"
                      aria-label={`Dokument ${document.name} löschen`}
                      onClick={() => void documents.handleDeleteDocument(document)}
                    >
                      Löschen
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="document-empty-state">
                <span>Keine Dokumente vorhanden</span>
              </li>
            )}
          </ul>
        </article>
      </div>

      {documents.documentEditState ? (
        <DocumentEditModal
          documentEditState={documents.documentEditState}
          onClose={() => documents.setDocumentEditState(null)}
          onFieldChange={documents.handleDocumentEditFieldChange}
          onSave={documents.handleSaveDocumentEdit}
        />
      ) : null}

      {documents.documentPreviewState ? (
        <DocumentPreviewModal
          documentPreviewState={documents.documentPreviewState}
          onClose={() => documents.setDocumentPreviewState(null)}
        />
      ) : null}

      {documents.pendingDocumentDeletion ? (
        <ConfirmationDialog
          heading="Löschen?"
          id="delete-document-title"
          actions={(
            <>
              <button
                type="button"
                className="secondary-action"
                disabled={documents.documentDeletionBusy}
                onClick={() => documents.setPendingDocumentDeletion(null)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="secondary-action danger-action"
                disabled={documents.documentDeletionBusy}
                onClick={() => void documents.handleConfirmDocumentDeletion()}
              >
                {documents.documentDeletionBusy ? 'Lösche…' : 'Löschen'}
              </button>
            </>
          )}
        >
          <p className="m-0 py-[0.9rem] px-4 rounded-[18px] bg-[rgba(165,71,34,0.12)] text-[#8f3415] leading-relaxed">
            Dokument {documents.pendingDocumentDeletion.name} löschen?
          </p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}