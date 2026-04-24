import {
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { defaultPlannerState, tabs, type PlannerState, type TabId } from '../../lib/planner-data';
import type {
  AuthState,
  CloudSyncState,
  CloudSyncSetterValue,
} from '../../app/types';
import type { SupabaseFamilyContext, SupabaseFamilyInvite } from '../../lib/supabase';
import { useDocumentManager } from '../../hooks/useDocumentManager';
import { useNoteManager } from '../../hooks/useNoteManager';
import { useCalendarManager } from '../../hooks/useCalendarManager';
import { useAdminDirectory } from '../../hooks/useAdminDirectory';
import { useCrudModules } from '../../hooks/useCrudModules';
import { useDeletionManager } from '../../hooks/useDeletionManager';
import { AccountCard } from './AccountCard';
import { CalendarModule } from './CalendarModule';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DocumentEditModal } from './DocumentEditModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentsModule } from './DocumentsModule';
import { FamilyModule } from './FamilyModule';
import { MealsModule } from './MealsModule';
import { NoteDialog } from './NoteDialog';
import { NotesModule } from './NotesModule';
import { PlannerOverview } from './PlannerOverview';
import { PlannerSidebar } from './PlannerSidebar';
import { PlannerTopbar } from './PlannerTopbar';
import { ShoppingModule } from './ShoppingModule';
import { TasksModule } from './TasksModule';

type PlannerShellProps = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  plannerState: PlannerState;
  setPlannerState: Dispatch<SetStateAction<PlannerState>>;
  familyInvites: SupabaseFamilyInvite[];
  setFamilyInvites: Dispatch<SetStateAction<SupabaseFamilyInvite[]>>;
  authState: AuthState;
  cloudSync: CloudSyncState;
  setCloudSync: Dispatch<SetStateAction<CloudSyncState>>;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onDeleteFamily: (familyId: string) => Promise<void>;
  onDeleteFamilyMemberAccount: (familyId: string, memberUserId: string) => Promise<void>;
  onUpdateFamilyRegistration: (allowOpenRegistration: boolean) => Promise<SupabaseFamilyContext>;
};

export default function PlannerShell({
  activeTab,
  setActiveTab,
  plannerState,
  setPlannerState,
  familyInvites,
  setFamilyInvites,
  authState,
  cloudSync,
  setCloudSync: setCloudSyncState,
  onSignOut,
  onDeleteAccount,
  onDeleteFamily,
  onDeleteFamilyMemberAccount,
  onUpdateFamilyRegistration,
}: PlannerShellProps) {
  const activeMember = useMemo(
    () =>
      plannerState.members.find((member) => member.id === plannerState.activeUserId)
      ?? plannerState.members[0],
    [plannerState.activeUserId, plannerState.members],
  );

  const setCloudSync = (value: CloudSyncSetterValue) => {
    setCloudSyncState((current) => {
      const nextValue =
        typeof value === 'function'
          ? (value as (current: CloudSyncState) => CloudSyncState | Omit<CloudSyncState, 'scope'>)(current)
          : value;

      return 'scope' in nextValue ? nextValue : { ...nextValue, scope: activeTab };
    });
  };

  const updateState = (updater: (current: PlannerState) => PlannerState) => {
    setPlannerState((current) => updater(current));
  };

  // --- Hooks ---

  const adminDir = useAdminDirectory({
    authState,
    setCloudSync,
    familyInvites,
    setFamilyInvites,
  });

  const documents = useDocumentManager({
    authState,
    plannerState,
    setCloudSync,
    updateState,
    activeTab,
  });

  const notes = useNoteManager({
    authState,
    plannerState,
    setCloudSync,
    updateState,
  });

  const calendar = useCalendarManager({
    authState,
    plannerState,
    setCloudSync,
    updateState,
  });

  const crud = useCrudModules({
    authState,
    setCloudSync,
    updateState,
  });

  const deletions = useDeletionManager({
    authState,
    setCloudSync,
    updateState,
    setAdminFamilyDirectory: adminDir.setAdminFamilyDirectory,
    setSelectedAdminFamilyId: adminDir.setSelectedAdminFamilyId,
    onDeleteAccount,
    onDeleteFamily,
    onDeleteFamilyMemberAccount,
  });

  // --- Derived values ---

  const openTasks = useMemo(
    () => plannerState.tasks.filter((task) => !task.done).length,
    [plannerState.tasks],
  );

  const pendingShopping = useMemo(
    () => plannerState.shoppingItems.filter((item) => !item.checked).length,
    [plannerState.shoppingItems],
  );

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => tab.id !== 'family' || adminDir.canViewFamily),
    [adminDir.canViewFamily],
  );

  // --- Effects ---

  useEffect(() => {
    if (!adminDir.canViewFamily && activeTab === 'family') {
      setActiveTab('overview');
    }
  }, [activeTab, adminDir.canViewFamily, setActiveTab]);

  useEffect(() => {
    if (!cloudSync.message || cloudSync.phase === 'loading') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCloudSyncState((current) =>
        current.message === cloudSync.message
        && current.phase === cloudSync.phase
        && current.scope === cloudSync.scope
          ? { phase: 'idle', message: null, scope: null }
          : current,
      );
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [cloudSync.message, cloudSync.phase, cloudSync.scope, setCloudSyncState]);

  // --- Handlers ---

  const handleSelectMember = (memberId: string) => {
    updateState((current) => ({ ...current, activeUserId: memberId }));
  };

  const authDriven = authState.stage === 'authenticated';

  return (
    <div className="app-shell">
      <PlannerSidebar
        activeTab={activeTab}
        authDriven={authDriven}
        authState={authState}
        openTasks={openTasks}
        pendingShopping={pendingShopping}
        plannerState={plannerState}
        setActiveTab={setActiveTab}
        visibleTabs={visibleTabs}
        onSelectMember={handleSelectMember}
        onSignOut={onSignOut}
      />

      <main className="content">
        <PlannerTopbar activeTab={activeTab} setActiveTab={setActiveTab} visibleTabs={visibleTabs} />

        <PlannerOverview
          activeTab={activeTab}
          openTasks={openTasks}
          plannerState={plannerState}
          sortedCalendarEntries={calendar.sortedCalendarEntries}
          onToggleTask={crud.handleToggleTask}
        />

        <ShoppingModule
          activeTab={activeTab}
          items={plannerState.shoppingItems}
          onAddShopping={crud.handleAddShopping}
          onToggleShopping={crud.handleToggleShopping}
        />

        <TasksModule
          activeTab={activeTab}
          ownerDefaultValue={authState.profile?.display_name ?? activeMember?.name ?? ''}
          tasks={plannerState.tasks}
          onAddTask={crud.handleAddTask}
          onToggleTask={crud.handleToggleTask}
        />

        <NotesModule
          activeTab={activeTab}
          notes={plannerState.notes}
          onAddNote={notes.handleAddNote}
          onDeleteNote={notes.handleDeleteNote}
          onOpenNote={notes.handleOpenNote}
        />

        {notes.noteDialogState ? (
          <NoteDialog
            note={notes.noteDialogState}
            onClose={() => notes.setNoteDialogState(null)}
            onEdit={() => notes.setNoteDialogState((current) => (current ? { ...current, isEditing: true } : current))}
            onFieldChange={notes.handleNoteDialogFieldChange}
            onSave={notes.handleSaveNote}
          />
        ) : null}

        {notes.pendingNoteDeletion ? (
          <ConfirmationDialog
            heading="Löschen?"
            id="delete-note-title"
            actions={(
              <>
                <button
                  type="button"
                  className="secondary-action"
                  disabled={notes.noteDeletionBusy}
                  onClick={() => notes.setPendingNoteDeletion(null)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="secondary-action danger-action"
                  disabled={notes.noteDeletionBusy}
                  onClick={() => void notes.handleConfirmNoteDeletion()}
                >
                  {notes.noteDeletionBusy ? 'Lösche…' : 'Löschen'}
                </button>
              </>
            )}
          >
            <p className="modal-note danger-note">
              Notiz {notes.pendingNoteDeletion.title} löschen?
            </p>
          </ConfirmationDialog>
        ) : null}

        <CalendarModule
          activeTab={activeTab}
          calendarMonth={calendar.calendarMonth}
          calendarViewDate={calendar.calendarViewDate}
          selectedCalendarDate={calendar.selectedCalendarDate}
          selectedDayEntries={calendar.selectedDayEntries}
          unscheduledCalendarEntries={calendar.unscheduledCalendarEntries}
          visibleMonthEventCount={calendar.visibleMonthEventCount}
          onAddCalendar={calendar.handleAddCalendar}
          onChangeCalendarMonth={calendar.handleChangeCalendarMonth}
          onSelectCalendarDate={calendar.setSelectedCalendarDate}
          onShowToday={calendar.handleShowTodayInCalendar}
        />

        <MealsModule
          activeTab={activeTab}
          meals={plannerState.meals}
          onAddMeal={crud.handleAddMeal}
          onToggleMealPrepared={crud.handleToggleMealPrepared}
        />

        <DocumentsModule
          activeTab={activeTab}
          documentKindFilter={documents.documentKindFilter}
          documentSearchTerm={documents.documentSearchTerm}
          documentSelectionErrors={documents.documentSelectionErrors}
          documentSelectionSummary={documents.documentSelectionSummary}
          documentSort={documents.documentSort}
          documentUploadProgress={documents.documentUploadProgress}
          isDocumentDropActive={documents.isDocumentDropActive}
          selectedDocumentFiles={documents.selectedDocumentFiles}
          totalDocumentCount={plannerState.documents.length}
          visibleDocuments={documents.visibleDocuments}
          onClearSelectedDocumentFiles={documents.handleClearSelectedDocumentFiles}
          onDeleteDocument={documents.handleDeleteDocument}
          onDocumentDragLeave={documents.handleDocumentDragLeave}
          onDocumentDragOver={documents.handleDocumentDragOver}
          onDocumentDrop={documents.handleDocumentDrop}
          onDocumentInputChange={documents.handleDocumentInputChange}
          onDocumentKindFilterChange={documents.setDocumentKindFilter}
          onDocumentSearchTermChange={documents.setDocumentSearchTerm}
          onDocumentSortChange={documents.setDocumentSort}
          onOpenDocumentPreview={documents.handleOpenDocumentPreview}
          onRemoveSelectedDocumentFile={documents.handleRemoveSelectedDocumentFile}
          onStartDocumentEdit={documents.handleStartDocumentEdit}
          onSubmit={documents.handleAddDocument}
        />

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
            <p className="modal-note danger-note">
              Dokument {documents.pendingDocumentDeletion.name} löschen?
            </p>
          </ConfirmationDialog>
        ) : null}

        <FamilyModule
          activeTab={activeTab}
          adminFamilyDirectory={adminDir.adminFamilyDirectory}
          adminFamilyDirectoryBusy={adminDir.adminFamilyDirectoryBusy}
          adminFamilyDirectoryError={adminDir.adminFamilyDirectoryError}
          adminInviteFamilies={adminDir.adminInviteFamilies}
          allowOpenRegistration={adminDir.allowOpenRegistration}
          authFamily={authState.family}
          authProfile={authState.profile}
          canInviteFamilyMembers={adminDir.canInviteFamilyMembers}
          canManageFamily={adminDir.canManageFamily}
          familyInvites={familyInvites}
          members={plannerState.members}
          pendingInviteActionId={adminDir.pendingInviteActionId}
          registrationConfigBusy={adminDir.registrationConfigBusy}
          selectedAdminFamily={adminDir.selectedAdminFamily}
          selectedInviteFamilyId={adminDir.selectedInviteFamily?.familyId ?? null}
          onAddMember={adminDir.handleAddMember}
          onOpenDeleteAccount={() => deletions.setIsDeleteAccountDialogOpen(true)}
          onRegistrationAccessChange={(nextValue) => void adminDir.handleRegistrationAccessChange(nextValue, onUpdateFamilyRegistration)}
          onRemoveInvite={adminDir.handleRemoveInvite}
          onSelectAdminFamily={adminDir.setSelectedAdminFamilyId}
          onSelectInviteFamily={adminDir.setSelectedInviteFamilyId}
          onSetPendingFamilyDeletion={deletions.setPendingFamilyDeletion}
          onSetPendingMemberDeletion={deletions.setPendingMemberDeletion}
        />

        {deletions.isDeleteAccountDialogOpen ? (
          <ConfirmationDialog
            heading="Bist du sicher?"
            id="delete-account-title"
            actions={(
              <>
                <button
                  type="button"
                  className="secondary-action"
                  disabled={deletions.deleteAccountBusy}
                  onClick={() => deletions.setIsDeleteAccountDialogOpen(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="secondary-action danger-action"
                  disabled={deletions.deleteAccountBusy}
                  onClick={() => void deletions.handleConfirmAccountDeletion()}
                >
                  {deletions.deleteAccountBusy ? 'Wird gelöscht…' : 'Ja, Account löschen'}
                </button>
              </>
            )}
          >
            <p className="modal-note danger-note">
              Dein Konto wird dauerhaft gelöscht. Wenn dieses Konto eine Familie besitzt, können auch zugehörige Familiendaten entfernt werden.
            </p>
          </ConfirmationDialog>
        ) : null}

        {deletions.pendingMemberDeletion ? (
          <ConfirmationDialog
            heading="Mitglied wirklich löschen?"
            id="delete-member-title"
            actions={(
              <>
                <button
                  type="button"
                  className="secondary-action"
                  disabled={deletions.memberDeletionBusy}
                  onClick={() => deletions.setPendingMemberDeletion(null)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="secondary-action danger-action"
                  disabled={deletions.memberDeletionBusy}
                  onClick={() => void deletions.handleConfirmMemberDeletion()}
                >
                  {deletions.memberDeletionBusy ? 'Wird gelöscht…' : 'Mitglied endgültig löschen'}
                </button>
              </>
            )}
          >
            <p className="modal-note danger-note">
              {deletions.pendingMemberDeletion.memberName} wird aus {deletions.pendingMemberDeletion.familyName} entfernt und das zugehörige Konto wird dauerhaft gelöscht.
            </p>
          </ConfirmationDialog>
        ) : null}

        {deletions.pendingFamilyDeletion ? (
          <ConfirmationDialog
            heading="Familie wirklich löschen?"
            id="delete-family-title"
            actions={(
              <>
                <button
                  type="button"
                  className="secondary-action"
                  disabled={deletions.familyDeletionBusy}
                  onClick={() => deletions.setPendingFamilyDeletion(null)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="secondary-action danger-action"
                  disabled={deletions.familyDeletionBusy}
                  onClick={() => void deletions.handleConfirmFamilyDeletion()}
                >
                  {deletions.familyDeletionBusy ? 'Wird gelöscht…' : 'Familie endgültig löschen'}
                </button>
              </>
            )}
          >
            <p className="modal-note danger-note">
              {deletions.pendingFamilyDeletion.familyName} mit {deletions.pendingFamilyDeletion.memberCount} Mitgliedern, Einladungen und Familiendaten wird dauerhaft gelöscht. Bereits vorhandene Benutzerkonten bleiben bestehen.
            </p>
            {deletions.pendingFamilyDeletion.isCurrentFamily ? (
              <p className="modal-note danger-note">
                Weil dies deine aktuell geöffnete Familie ist, wirst du danach aus der App abgemeldet.
              </p>
            ) : null}
          </ConfirmationDialog>
        ) : null}

        {!authDriven ? (
          <section className="module reset-panel is-visible">
            <button
              type="button"
              className="reset-button"
              onClick={() => setPlannerState(defaultPlannerState)}
            >
              Lokale Daten zurücksetzen
            </button>
          </section>
        ) : null}

        <AccountCard
          authDriven={authDriven}
          authState={authState}
          className="account-card mobile-account-card"
          plannerState={plannerState}
          onSelectMember={handleSelectMember}
          onSignOut={onSignOut}
          showPermissionNote
        />
      </main>
    </div>
  );
}
