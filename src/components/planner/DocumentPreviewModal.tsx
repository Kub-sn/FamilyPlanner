import type { DocumentPreviewState } from '../../app/types';
import { ModalDialog } from './ModalDialog';

export function DocumentPreviewModal({
  documentPreviewState,
  onClose,
}: {
  documentPreviewState: DocumentPreviewState;
  onClose: () => void;
}) {
  return (
    <ModalDialog
      id="document-preview-title"
      title={documentPreviewState.name}
      eyebrow="Dokument-Vorschau"
      className="w-[min(980px,100%)]"
      actions={(
        <>
          <button type="button" className="secondary-action" onClick={onClose}>
            Abbrechen
          </button>
          <a className="secondary-action no-underline" href={documentPreviewState.url} target="_blank" rel="noreferrer">
            In neuem Tab öffnen
          </a>
        </>
      )}
    >
      <div className="document-preview-modal-body">
        {documentPreviewState.kind === 'image' ? (
          <img
            className="document-preview-full"
            src={documentPreviewState.url}
            alt={`Vorschau für ${documentPreviewState.name}`}
          />
        ) : (
          <iframe
            className="document-preview-frame"
            src={documentPreviewState.url}
            title={`PDF-Vorschau für ${documentPreviewState.name}`}
          />
        )}
      </div>
    </ModalDialog>
  );
}