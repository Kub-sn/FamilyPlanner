import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { AuthState, CloudSyncSetterValue } from '../app/types';
import {
  createFamilyInvite,
  fetchAdminFamilyDirectory,
  removeFamilyInvite,
  type AdminFamilyDirectoryFamily,
  type SupabaseFamilyInvite,
} from '../lib/supabase';
import { humanizeAuthError } from '../lib/auth-errors';
import type { Dispatch, SetStateAction } from 'react';

type InviteTargetFamily = {
  familyId: string;
  familyName: string;
};

type UseAdminDirectoryParams = {
  authState: AuthState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  familyInvites: SupabaseFamilyInvite[];
  setFamilyInvites: Dispatch<SetStateAction<SupabaseFamilyInvite[]>>;
};

export function useAdminDirectory({
  authState,
  setCloudSync,
  familyInvites,
  setFamilyInvites,
}: UseAdminDirectoryParams) {
  const effectiveRole = authState.profile?.role ?? 'familyuser';
  const canManageFamily = effectiveRole === 'admin';
  const canViewFamily = Boolean(authState.family);
  const canInviteFamilyMembers = canManageFamily || authState.family?.isOwner === true;
  const allowOpenRegistration = authState.family?.allowOpenRegistration ?? true;

  const [adminFamilyDirectory, setAdminFamilyDirectory] = useState<AdminFamilyDirectoryFamily[]>([]);
  const [adminFamilyDirectoryBusy, setAdminFamilyDirectoryBusy] = useState(false);
  const [adminFamilyDirectoryError, setAdminFamilyDirectoryError] = useState<string | null>(null);
  const [selectedAdminFamilyId, setSelectedAdminFamilyId] = useState<string | null>(null);
  const [selectedInviteFamilyId, setSelectedInviteFamilyId] = useState<string | null>(null);
  const [pendingInviteActionId, setPendingInviteActionId] = useState<string | null>(null);
  const [registrationConfigBusy, setRegistrationConfigBusy] = useState(false);

  const adminInviteFamilies = useMemo<InviteTargetFamily[]>(() => {
    if (!canManageFamily) {
      return [];
    }
    if (adminFamilyDirectory.length > 0) {
      return adminFamilyDirectory.map((family) => ({
        familyId: family.familyId,
        familyName: family.familyName,
      }));
    }
    if (!authState.family) {
      return [];
    }
    return [{
      familyId: authState.family.familyId,
      familyName: authState.family.familyName,
    }];
  }, [adminFamilyDirectory, authState.family, canManageFamily]);

  const selectedAdminFamily = useMemo(
    () =>
      adminFamilyDirectory.find((family) => family.familyId === selectedAdminFamilyId)
      ?? adminFamilyDirectory[0]
      ?? null,
    [adminFamilyDirectory, selectedAdminFamilyId],
  );

  const selectedInviteFamily = useMemo(
    () =>
      adminInviteFamilies.find((family) => family.familyId === selectedInviteFamilyId)
      ?? adminInviteFamilies[0]
      ?? null,
    [adminInviteFamilies, selectedInviteFamilyId],
  );

  useEffect(() => {
    if (authState.stage !== 'authenticated' || authState.profile?.role !== 'admin') {
      setAdminFamilyDirectory([]);
      setAdminFamilyDirectoryBusy(false);
      setAdminFamilyDirectoryError(null);
      setSelectedAdminFamilyId(null);
      return;
    }

    let cancelled = false;

    const loadAdminFamilyDirectory = async () => {
      setAdminFamilyDirectoryBusy(true);
      setAdminFamilyDirectoryError(null);

      try {
        const families = await fetchAdminFamilyDirectory();
        if (cancelled) return;

        setAdminFamilyDirectory(families);
        setSelectedAdminFamilyId((current) => {
          if (current && families.some((family) => family.familyId === current)) {
            return current;
          }
          const currentFamilyId = authState.family?.familyId;
          return families.find((family) => family.familyId === currentFamilyId)?.familyId ?? families[0]?.familyId ?? null;
        });
      } catch (error) {
        if (cancelled) return;
        setAdminFamilyDirectory([]);
        setSelectedAdminFamilyId(null);
        setAdminFamilyDirectoryError(humanizeAuthError(error));
      } finally {
        if (!cancelled) {
          setAdminFamilyDirectoryBusy(false);
        }
      }
    };

    void loadAdminFamilyDirectory();
    return () => { cancelled = true; };
  }, [authState.family?.familyId, authState.profile?.role, authState.stage]);

  useEffect(() => {
    if (!canManageFamily) {
      setSelectedInviteFamilyId(null);
      return;
    }
    setSelectedInviteFamilyId((current) => {
      if (current && adminInviteFamilies.some((family) => family.familyId === current)) {
        return current;
      }
      const currentFamilyId = authState.family?.familyId;
      return adminInviteFamilies.find((family) => family.familyId === currentFamilyId)?.familyId
        ?? adminInviteFamilies[0]?.familyId
        ?? null;
    });
  }, [adminInviteFamilies, authState.family?.familyId, canManageFamily]);

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get('email') || '').trim();
    const role = String(form.get('role') || 'familyuser').trim() as 'admin' | 'familyuser';
    const targetFamilyId = canManageFamily
      ? String(form.get('familyId') || selectedInviteFamily?.familyId || '').trim()
      : authState.family?.familyId ?? '';
    const targetFamilyName = canManageFamily
      ? selectedInviteFamily?.familyName ?? authState.family?.familyName ?? 'die gewaehlte Familie'
      : authState.family?.familyName ?? 'deine Familie';

    if (
      !authState.family
      || !authState.profile
      || !canInviteFamilyMembers
      || !email
      || (role !== 'admin' && role !== 'familyuser')
      || !targetFamilyId
      || (canManageFamily && !adminInviteFamilies.some((family) => family.familyId === targetFamilyId))
    ) {
      return;
    }

    const inviteRole = canManageFamily ? role : 'familyuser';

    try {
      const result = await createFamilyInvite(targetFamilyId, email, inviteRole);
      if (result.invite.familyId === authState.family.familyId) {
        setFamilyInvites((current) => [
          result.invite,
          ...current.filter((entry) => entry.id !== result.invite.id),
        ]);
      }
      formElement.reset();
      setCloudSync({
        phase: 'ready',
        message:
          result.invite.familyId === authState.family.familyId
            ? result.emailSent
              ? 'Einladung wurde gespeichert und per E-Mail verschickt.'
              : 'Einladung wurde gespeichert.'
            : result.emailSent
              ? `Einladung fuer ${targetFamilyName} wurde gespeichert und per E-Mail verschickt.`
              : `Einladung fuer ${targetFamilyName} wurde gespeichert.`,
      });
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    }
  };

  const handleRemoveInvite = async (inviteId: string) => {
    if (!canInviteFamilyMembers) {
      return;
    }
    setPendingInviteActionId(inviteId);

    try {
      await removeFamilyInvite(inviteId);
      setFamilyInvites((current) => current.filter((invite) => invite.id !== inviteId));
      setCloudSync({
        phase: 'ready',
        message: 'Einladung wurde zurückgezogen.',
      });
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setPendingInviteActionId((current) => (current === inviteId ? null : current));
    }
  };

  const handleRegistrationAccessChange = async (
    nextValue: boolean,
    onUpdateFamilyRegistration: (allow: boolean) => Promise<unknown>,
  ) => {
    if (!authState.family || !canManageFamily) {
      return;
    }
    setRegistrationConfigBusy(true);

    try {
      await onUpdateFamilyRegistration(nextValue);
      setCloudSync({
        phase: 'ready',
        message: nextValue
          ? 'Freie Registrierung wurde aktiviert.'
          : 'Freie Registrierung wurde deaktiviert.',
      });
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setRegistrationConfigBusy(false);
    }
  };

  return {
    // Derived
    effectiveRole,
    canManageFamily,
    canViewFamily,
    canInviteFamilyMembers,
    allowOpenRegistration,

    // State
    adminFamilyDirectory,
    setAdminFamilyDirectory,
    adminFamilyDirectoryBusy,
    adminFamilyDirectoryError,
    selectedAdminFamilyId,
    setSelectedAdminFamilyId,
    adminInviteFamilies,
    selectedAdminFamily,
    selectedInviteFamily,
    pendingInviteActionId,
    registrationConfigBusy,

    // Setters
    setSelectedInviteFamilyId,

    // Handlers
    handleAddMember,
    handleRemoveInvite,
    handleRegistrationAccessChange,
  };
}
