import { useState } from 'react';
import type { PlannerState } from '../lib/planner-data';
import type {
  AuthState,
  CloudSyncSetterValue,
  PendingFamilyDeletionState,
  PendingMemberDeletionState,
} from '../app/types';
import { humanizeAuthError } from '../lib/auth-errors';
import type { AdminFamilyDirectoryFamily } from '../lib/supabase';
import type { Dispatch, SetStateAction } from 'react';

type UseDeletionManagerParams = {
  authState: AuthState;
  setCloudSync: (value: CloudSyncSetterValue) => void;
  updateState: (updater: (current: PlannerState) => PlannerState) => void;
  setAdminFamilyDirectory: Dispatch<SetStateAction<AdminFamilyDirectoryFamily[]>>;
  setSelectedAdminFamilyId: Dispatch<SetStateAction<string | null>>;
  onDeleteAccount: () => Promise<void>;
  onDeleteFamily: (familyId: string) => Promise<void>;
  onDeleteFamilyMemberAccount: (familyId: string, memberUserId: string) => Promise<void>;
};

export function useDeletionManager({
  authState,
  setCloudSync,
  updateState,
  setAdminFamilyDirectory,
  setSelectedAdminFamilyId,
  onDeleteAccount,
  onDeleteFamily,
  onDeleteFamilyMemberAccount,
}: UseDeletionManagerParams) {
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [pendingMemberDeletion, setPendingMemberDeletion] = useState<PendingMemberDeletionState | null>(null);
  const [memberDeletionBusy, setMemberDeletionBusy] = useState(false);
  const [pendingFamilyDeletion, setPendingFamilyDeletion] = useState<PendingFamilyDeletionState | null>(null);
  const [familyDeletionBusy, setFamilyDeletionBusy] = useState(false);

  const handleConfirmAccountDeletion = async () => {
    setDeleteAccountBusy(true);
    try {
      await onDeleteAccount();
      setIsDeleteAccountDialogOpen(false);
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setDeleteAccountBusy(false);
    }
  };

  const handleConfirmMemberDeletion = async () => {
    if (!pendingMemberDeletion) {
      return;
    }
    setMemberDeletionBusy(true);

    try {
      await onDeleteFamilyMemberAccount(pendingMemberDeletion.familyId, pendingMemberDeletion.memberId);

      setAdminFamilyDirectory((current) =>
        current.map((family) =>
          family.familyId === pendingMemberDeletion.familyId
            ? {
                ...family,
                members: family.members.filter((member) => member.id !== pendingMemberDeletion.memberId),
              }
            : family,
        ),
      );
      setSelectedAdminFamilyId(pendingMemberDeletion.familyId);

      if (authState.family?.familyId === pendingMemberDeletion.familyId) {
        updateState((current) => ({
          ...current,
          members: current.members.filter((member) => member.id !== pendingMemberDeletion.memberId),
        }));
      }

      setCloudSync({
        phase: 'ready',
        message: `${pendingMemberDeletion.memberName} wurde inklusive Konto gelöscht.`,
      });
      setPendingMemberDeletion(null);
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setMemberDeletionBusy(false);
    }
  };

  const handleConfirmFamilyDeletion = async () => {
    if (!pendingFamilyDeletion) {
      return;
    }
    setFamilyDeletionBusy(true);

    try {
      await onDeleteFamily(pendingFamilyDeletion.familyId);

      setAdminFamilyDirectory((current) =>
        current.filter((family) => family.familyId !== pendingFamilyDeletion.familyId),
      );
      setSelectedAdminFamilyId((current) =>
        current === pendingFamilyDeletion.familyId ? null : current,
      );
      setCloudSync({
        phase: 'ready',
        message: pendingFamilyDeletion.isCurrentFamily
          ? `Die Familie ${pendingFamilyDeletion.familyName} wurde gelöscht. Deine Sitzung wurde beendet.`
          : `Die Familie ${pendingFamilyDeletion.familyName} wurde gelöscht.`,
      });
      setPendingFamilyDeletion(null);
    } catch (error) {
      setCloudSync({
        phase: 'error',
        message: humanizeAuthError(error),
      });
    } finally {
      setFamilyDeletionBusy(false);
    }
  };

  return {
    isDeleteAccountDialogOpen,
    setIsDeleteAccountDialogOpen,
    deleteAccountBusy,
    pendingMemberDeletion,
    setPendingMemberDeletion,
    memberDeletionBusy,
    pendingFamilyDeletion,
    setPendingFamilyDeletion,
    familyDeletionBusy,
    handleConfirmAccountDeletion,
    handleConfirmMemberDeletion,
    handleConfirmFamilyDeletion,
  };
}
