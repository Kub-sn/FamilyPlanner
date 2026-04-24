import type { FormEvent } from 'react';
import type { PendingFamilyDeletionState, PendingMemberDeletionState } from '../../app/types';
import type { PlannerState, UserRole } from '../../lib/planner-data';
import type { AdminFamilyDirectoryFamily, SupabaseFamilyContext, SupabaseFamilyInvite, SupabaseProfile } from '../../lib/supabase';
import { FamilyStatusBadges, getRoleChipClass, getRoleLabel, isFamilyOwnerMember } from './planner-shell-utils';
import { useActiveTab } from '../../context/ActiveTabContext';

function getMemberMonogram(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'FM';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function FamilyModule({
  adminFamilyDirectory,
  adminFamilyDirectoryBusy,
  adminFamilyDirectoryError,
  adminInviteFamilies,
  allowOpenRegistration,
  authFamily,
  authProfile,
  canInviteFamilyMembers,
  canManageFamily,
  familyInvites,
  members,
  pendingInviteActionId,
  registrationConfigBusy,
  selectedAdminFamily,
  selectedInviteFamilyId,
  onAddMember,
  onOpenDeleteAccount,
  onRegistrationAccessChange,
  onRemoveInvite,
  onSelectAdminFamily,
  onSelectInviteFamily,
  onSetPendingFamilyDeletion,
  onSetPendingMemberDeletion,
}: {
  adminFamilyDirectory: AdminFamilyDirectoryFamily[];
  adminFamilyDirectoryBusy: boolean;
  adminFamilyDirectoryError: string | null;
  adminInviteFamilies: Array<{ familyId: string; familyName: string }>;
  allowOpenRegistration: boolean;
  authFamily: SupabaseFamilyContext | null;
  authProfile: SupabaseProfile | null;
  canInviteFamilyMembers: boolean;
  canManageFamily: boolean;
  familyInvites: SupabaseFamilyInvite[];
  members: PlannerState['members'];
  pendingInviteActionId: string | null;
  registrationConfigBusy: boolean;
  selectedAdminFamily: AdminFamilyDirectoryFamily | null;
  selectedInviteFamilyId: string | null;
  onAddMember: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onOpenDeleteAccount: () => void;
  onRegistrationAccessChange: (value: boolean) => Promise<void>;
  onRemoveInvite: (inviteId: string) => Promise<void>;
  onSelectAdminFamily: (familyId: string) => void;
  onSelectInviteFamily: (familyId: string) => void;
  onSetPendingFamilyDeletion: (value: PendingFamilyDeletionState) => void;
  onSetPendingMemberDeletion: (value: PendingMemberDeletionState) => void;
}) {
  const { activeTab } = useActiveTab();
  const canViewFamily = Boolean(authFamily);
  const accountPanelClassName = 'panel list-panel account-management-panel family-account-panel';
  const invitePanel = (
    <form className="panel form-panel family-invite-panel" onSubmit={(event) => void onAddMember(event)}>
      <h4>Familienmitglied einladen</h4>
      {canManageFamily ? (
        <label className="invite-family-field">
          <span>Familie</span>
          <select
            name="familyId"
            aria-label="Familie fuer Einladung"
            value={selectedInviteFamilyId ?? ''}
            disabled={!canInviteFamilyMembers || adminInviteFamilies.length === 0}
            onChange={(event) => onSelectInviteFamily(event.currentTarget.value)}
          >
            {adminInviteFamilies.map((family) => (
              <option key={family.familyId} value={family.familyId}>
                {family.familyName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <input name="email" placeholder="E-Mail" disabled={!canInviteFamilyMembers} />
      <select name="role" aria-label="Rolle fuer Einladung" defaultValue="familyuser" disabled={!canManageFamily}>
        <option value="familyuser">familyuser</option>
        {canManageFamily ? <option value="admin">admin</option> : null}
      </select>
      <button type="submit" disabled={!canInviteFamilyMembers}>
        {canInviteFamilyMembers
          ? 'Einladung senden'
          : 'Nur Familiengruender oder Admin kann Einladungen senden'}
      </button>
      <small>
        Die Einladung wird per E-Mail verschickt. Sobald sich der Nutzer mit derselben
        E-Mail registriert oder anmeldet, wird die Familienzuordnung automatisch uebernommen.
      </small>
    </form>
  );
  const accountPanel = authProfile ? (
    <article className={accountPanelClassName}>
      <div className="panel-heading">
        <h4>Konto</h4>
      </div>
      <p className="family-management-note">
        Wenn du dein Konto löschst, wird der Zugang dauerhaft entfernt.
      </p>
      <button type="button" className="secondary-action danger-action" onClick={onOpenDeleteAccount}>
        Account löschen
      </button>
    </article>
  ) : null;
  const registrationPanel = canManageFamily && authFamily ? (
    <article className="panel form-panel family-config-panel">
      <div className="panel-heading">
        <h4>Registrierungeinstellung</h4>
        <span className={allowOpenRegistration ? 'chip' : 'chip alt'}>
          {allowOpenRegistration ? 'Offen' : 'Nur Einladung'}
        </span>
      </div>
      <label className="family-config-toggle">
        <div className="family-config-toggle-copy">
          <strong>Freie Registrierung erlauben</strong>
          <small>
            Wenn du das deaktivierst, koennen neue Konten nur noch mit einer offenen
            Einladung erstellt werden.
          </small>
        </div>
        <input
          type="checkbox"
          className="app-switch"
          aria-label="Freie Registrierung erlauben"
          name="allow-open-registration"
          checked={allowOpenRegistration}
          disabled={registrationConfigBusy}
          onChange={(event) => void onRegistrationAccessChange(event.currentTarget.checked)}
        />
      </label>
      <p className="family-config-note">
        {allowOpenRegistration ? 'Neue Nutzer koennen sich aktuell auch ohne Einladung registrieren.' : null}
      </p>
    </article>
  ) : null;

  return (
    <section className={activeTab === 'family' && canViewFamily ? 'module is-visible' : 'module'}>
      <div className="module-layout role-layout family-settings-layout">
        <div className="family-settings-top-row">
          <article className="panel list-panel family-members-panel">
            <div className="panel-heading family-members-panel-heading">
              <div className="family-members-panel-copy">
                <h4>Familienmitglieder</h4>
                <p className="family-management-note family-members-intro">
                  Jede Person steht in einer eigenen Zeile mit Rolle, E-Mail und Status, damit du sie im Desktop-Layout sofort unterscheiden kannst.
                </p>
              </div>
              <span className="chip">{members.length}</span>
            </div>
            <ul className="family-member-list" aria-label="Familienmitglieder Liste">
              {members.length > 0 ? (
                members.map((member, index) => (
                  <li key={member.id} className="family-member-card">
                    <div className="family-member-main">
                      <span className="family-member-avatar" aria-hidden="true">
                        {getMemberMonogram(member.name)}
                      </span>
                      <div className="family-entry-copy family-member-copy">
                        <div className="family-member-title-row">
                          <strong>{member.name}</strong>
                          <span className="family-member-slot">{authProfile?.id === member.id ? 'Du' : `Mitglied ${index + 1}`}</span>
                        </div>
                        <small>{member.email}</small>
                      </div>
                    </div>
                    <div className="family-member-badges">
                      <FamilyStatusBadges role={member.role} isOwner={isFamilyOwnerMember(member.id, authFamily)} />
                    </div>
                  </li>
                ))
              ) : (
                <li className="family-member-card family-member-empty">
                  <div className="family-entry-copy">
                    <strong>Noch keine Mitglieder geladen</strong>
                    <small>Nach Login und Familienzuordnung werden echte Mitglieder aus Supabase angezeigt.</small>
                  </div>
                </li>
              )}
            </ul>
            <div className="panel-heading panel-heading-tight family-inline-heading">
              <h4>Offene Einladungen</h4>
              <span className="chip">{familyInvites.length}</span>
            </div>
            {familyInvites.length > 0 ? (
              <ul className="document-list compact invite-card-list">
                {familyInvites.map((invite) => (
                  <li key={invite.id} className="invite-card-item">
                    <div className="family-entry-copy invite-card-copy">
                      <strong>{invite.email}</strong>
                      <span className={getRoleChipClass(invite.role as UserRole)}>{getRoleLabel(invite.role as UserRole)}</span>
                    </div>
                    <div className="invite-card-actions">
                      {canInviteFamilyMembers ? (
                        <button
                          type="button"
                          className="ghost-toggle"
                          disabled={pendingInviteActionId === invite.id}
                          aria-label={`Einladung für ${invite.email} zurückziehen`}
                          onClick={() => void onRemoveInvite(invite.id)}
                        >
                          {pendingInviteActionId === invite.id ? 'Wird entfernt…' : 'Zurückziehen'}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <div className="family-secondary-stack">
            {invitePanel}
            {!canManageFamily ? accountPanel : null}
          </div>
        </div>

        {canManageFamily ? (
          <article className="panel list-panel admin-directory-panel">
              <div className="panel-heading family-inline-heading">
                <h4>Alle Familien</h4>
                <span className="chip">{adminFamilyDirectory.length}</span>
              </div>
              {adminFamilyDirectoryBusy ? (
                <p className="family-management-note">Familienliste wird geladen…</p>
              ) : null}
              {adminFamilyDirectoryError ? <p className="auth-feedback auth-error">{adminFamilyDirectoryError}</p> : null}
              {!adminFamilyDirectoryBusy && !adminFamilyDirectoryError && adminFamilyDirectory.length === 0 ? (
                <p className="family-management-note">Noch keine Familien für die Übersicht gefunden.</p>
              ) : null}
              {adminFamilyDirectory.length > 0 ? (
                <>
                  <div className="family-directory-switcher" role="tablist" aria-label="Zwischen Familien wechseln">
                    {adminFamilyDirectory.map((family) => (
                      <button
                        key={family.familyId}
                        type="button"
                        className={selectedAdminFamily?.familyId === family.familyId ? 'family-directory-button active' : 'family-directory-button'}
                        aria-pressed={selectedAdminFamily?.familyId === family.familyId}
                        onClick={() => onSelectAdminFamily(family.familyId)}
                      >
                        <strong>{family.familyName}</strong>
                        <small>{family.members.length} Mitglieder</small>
                      </button>
                    ))}
                  </div>

                  {selectedAdminFamily ? (
                    <div className="family-directory-detail">
                      <div className="panel-heading panel-heading-tight family-directory-summary">
                        <div className="family-directory-summary-copy">
                          <strong>{selectedAdminFamily.familyName}</strong>
                          <small>
                            {selectedAdminFamily.members.filter((member) => member.role === 'admin').length} Admin · {selectedAdminFamily.members.length} Mitglieder
                          </small>
                        </div>
                        <div className="family-directory-summary-actions">
                          <button
                            type="button"
                            className="secondary-action danger-action"
                            aria-label={`Familie ${selectedAdminFamily.familyName} löschen`}
                            onClick={() =>
                              onSetPendingFamilyDeletion({
                                familyId: selectedAdminFamily.familyId,
                                familyName: selectedAdminFamily.familyName,
                                memberCount: selectedAdminFamily.members.length,
                                isCurrentFamily: authFamily?.familyId === selectedAdminFamily.familyId,
                              })
                            }
                          >
                            Familie löschen
                          </button>
                        </div>
                      </div>
                      <ul className="document-list family-directory-members">
                        {selectedAdminFamily.members.map((member) => (
                          <li key={member.id} className="family-directory-member-card">
                            <div className="family-entry-copy family-directory-member-copy">
                              <div className="family-entry-heading">
                                <strong>{member.name}</strong>
                                <FamilyStatusBadges role={member.role as UserRole} isOwner={member.isOwner} />
                              </div>
                              <small>{member.email}</small>
                            </div>
                            <div className="family-directory-member-actions">
                              {!member.isOwner && member.id !== authProfile?.id ? (
                                <button
                                  type="button"
                                  className="ghost-toggle danger-action"
                                  aria-label={`Mitglied ${member.email || member.name} aus ${selectedAdminFamily.familyName} löschen`}
                                  onClick={() =>
                                    onSetPendingMemberDeletion({
                                      familyId: selectedAdminFamily.familyId,
                                      familyName: selectedAdminFamily.familyName,
                                      memberId: member.id,
                                      memberName: member.name,
                                      memberEmail: member.email,
                                    })
                                  }
                                >
                                  Mitglied löschen
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}
          </article>
        ) : null}

        {canManageFamily ? (
          <div className="family-settings-bottom-row">
            {registrationPanel}
            {accountPanel}
          </div>
        ) : null}
      </div>
    </section>
  );
}