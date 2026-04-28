import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActiveTabProvider } from '../../context/ActiveTabContext';
import { plannerFixture } from './planner-test-fixtures';
import { DocumentsModule } from './DocumentsModule';

vi.mock('../../hooks/useDocumentManager', () => ({
  useDocumentManager: vi.fn(),
}));

import { useDocumentManager } from '../../hooks/useDocumentManager';

const mockUseDocumentManager = vi.mocked(useDocumentManager);

function buildDocumentManagerMock(overrides: Record<string, unknown> = {}) {
  return {
    selectedDocumentFiles: [],
    documentSelectionErrors: [],
    documentSelectionSummary: '',
    isDocumentDropActive: false,
    documentSearchTerm: '',
    documentKindFilter: 'all' as const,
    documentSort: 'recent' as const,
    documentEditState: null,
    documentPreviewState: null,
    pendingDocumentDeletion: null,
    documentDeletionBusy: false,
    documentUploadProgress: null,
    visibleDocuments: plannerFixture.documents,
    setDocumentSearchTerm: vi.fn(),
    setDocumentKindFilter: vi.fn(),
    setDocumentSort: vi.fn(),
    setDocumentEditState: vi.fn(),
    setDocumentPreviewState: vi.fn(),
    setPendingDocumentDeletion: vi.fn(),
    handleDocumentInputChange: vi.fn(),
    handleDocumentDrop: vi.fn(),
    handleDocumentDragOver: vi.fn(),
    handleDocumentDragLeave: vi.fn(),
    handleClearSelectedDocumentFiles: vi.fn(),
    handleRemoveSelectedDocumentFile: vi.fn(),
    handleStartDocumentEdit: vi.fn(),
    handleDocumentEditFieldChange: vi.fn(),
    handleSaveDocumentEdit: vi.fn().mockResolvedValue(undefined),
    handleOpenDocumentPreview: vi.fn(),
    handleDeleteDocument: vi.fn().mockResolvedValue(undefined),
    handleConfirmDocumentDeletion: vi.fn().mockResolvedValue(undefined),
    handleAddDocument: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('DocumentsModule', () => {
  it('renders documents and forwards document actions', async () => {
    const user = userEvent.setup();
    const mock = buildDocumentManagerMock();
    mockUseDocumentManager.mockReturnValue(mock);

    render(
      <ActiveTabProvider activeTab="documents" setActiveTab={vi.fn()}>
        <DocumentsModule
          authState={{ stage: 'signed-out', session: null, profile: null, family: null, error: null, message: null }}
          plannerState={plannerFixture}
          setCloudSync={vi.fn()}
          updateState={vi.fn()}
        />
      </ActiveTabProvider>,
    );

    expect(screen.getByText('Datei hochladen')).toBeInTheDocument();
    expect(screen.getByText('Versicherung PDF')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Dokumente suchen'), 'Versicherung');
    await user.click(screen.getByRole('button', { name: /Vorschau öffnen/i }));
    await user.click(screen.getByRole('button', { name: /bearbeiten/i }));
    await user.click(screen.getByRole('button', { name: /löschen/i }));

    expect(mock.setDocumentSearchTerm).toHaveBeenCalled();
    expect(mock.handleOpenDocumentPreview).toHaveBeenCalledWith(plannerFixture.documents[0]);
    expect(mock.handleStartDocumentEdit).toHaveBeenCalledWith(plannerFixture.documents[0]);
    expect(mock.handleDeleteDocument).toHaveBeenCalledWith(plannerFixture.documents[0]);
  });
});