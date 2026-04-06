import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

function buildInsertBuilder(result: { data: unknown; error: unknown }) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function buildExistingInviteBuilder(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

function buildDeleteInviteBuilder(result: { data: unknown; error: unknown }) {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

function buildFamilyUpdateBuilder(result: { data: unknown; error: unknown }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
}

describe('auth email normalization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
  });

  it('normalizes sign-in email addresses to lowercase', async () => {
    const signInWithPasswordMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    createClientMock.mockReturnValue({
      auth: {
        signInWithPassword: signInWithPasswordMock,
      },
    });

    const { signInWithPassword } = await import('./supabase');

    await signInWithPassword('Kubi.Y@Example.com ', 'supersecret');

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'kubi.y@example.com',
      password: 'supersecret',
    });
  });

  it('normalizes sign-up email addresses to lowercase', async () => {
    const signUpMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    createClientMock.mockReturnValue({
      auth: {
        signUp: signUpMock,
      },
    });

    const { signUpWithPassword } = await import('./supabase');

    await signUpWithPassword('Kubi.Y@Example.com ', 'supersecret', 'Kubi');

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'kubi.y@example.com',
      password: 'supersecret',
      options: {
        data: {
          display_name: 'Kubi',
        },
        emailRedirectTo: window.location.origin,
      },
    });
  });

  it('uses the current origin for password reset emails', async () => {
    const resetPasswordForEmailMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    createClientMock.mockReturnValue({
      auth: {
        resetPasswordForEmail: resetPasswordForEmailMock,
      },
    });

    const { resetPasswordForEmail } = await import('./supabase');

    await resetPasswordForEmail('Kubi.Y@Example.com ');

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('kubi.y@example.com', {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  });

  it('updates the current user password', async () => {
    const updateUserMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    createClientMock.mockReturnValue({
      auth: {
        updateUser: updateUserMock,
      },
    });

    const { updatePassword } = await import('./supabase');

    await updatePassword('new-super-secret');

    expect(updateUserMock).toHaveBeenCalledWith({
      password: 'new-super-secret',
    });
  });

  it('invokes the delete account edge function with the refreshed auth token', async () => {
    const refreshSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'fresh-access-token-delete',
        },
      },
      error: null,
    });
    const getSessionMock = vi.fn();
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const setAuthMock = vi.fn();

    createClientMock.mockReturnValue({
      auth: {
        refreshSession: refreshSessionMock,
        getSession: getSessionMock,
        signOut: signOutMock,
      },
      functions: {
        setAuth: setAuthMock,
        invoke: invokeMock,
      },
    });

    const { deleteCurrentAccount } = await import('./supabase');

    await deleteCurrentAccount();

    expect(setAuthMock).toHaveBeenCalledWith('fresh-access-token-delete');
    expect(invokeMock).toHaveBeenCalledWith('delete-own-account', {
      headers: {
        Authorization: 'Bearer fresh-access-token-delete',
      },
    });
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'local' });
    expect(getSessionMock).not.toHaveBeenCalled();
  });
});

describe('createFamilyInvite', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    window.history.replaceState({}, '', '/app');
  });

  it('creates an invite and invokes the invite email function', async () => {
    const inviteRow = {
      id: 'invite-1',
      family_id: 'family-1',
      email: 'new@example.com',
      role: 'familyuser',
      created_at: '2026-04-04T10:00:00.000Z',
      accepted_at: null,
    };
    const familyInviteBuilder = buildInsertBuilder({
      data: inviteRow,
      error: null,
    });
    const refreshSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'fresh-access-token-1',
        },
      },
      error: null,
    });
    const getSessionMock = vi.fn();
    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const setAuthMock = vi.fn();

    createClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(familyInviteBuilder),
      auth: {
        refreshSession: refreshSessionMock,
        getSession: getSessionMock,
      },
      functions: {
        setAuth: setAuthMock,
        invoke: invokeMock,
      },
    });

    const { createFamilyInvite } = await import('./supabase');
    const result = await createFamilyInvite(
      'family-1',
      'New@example.com',
      'familyuser',
      'user-1',
    );

    expect(result).toEqual({
      invite: {
        id: 'invite-1',
        familyId: 'family-1',
        email: 'new@example.com',
        role: 'familyuser',
        createdAt: '2026-04-04T10:00:00.000Z',
        acceptedAt: null,
      },
      emailSent: true,
    });
    expect(setAuthMock).toHaveBeenCalledWith('fresh-access-token-1');
    expect(invokeMock).toHaveBeenCalledWith('send-family-invite', {
      body: {
        inviteId: 'invite-1',
        appUrl: window.location.origin,
      },
      headers: {
        Authorization: 'Bearer fresh-access-token-1',
      },
    });
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('reuses an existing pending invite when the email is already invited', async () => {
    const duplicateError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    };
    const existingInvite = {
      id: 'invite-existing',
      family_id: 'family-1',
      email: 'new@example.com',
      role: 'familyuser',
      created_at: '2026-04-04T09:00:00.000Z',
      accepted_at: null,
    };
    const insertBuilder = buildInsertBuilder({
      data: null,
      error: duplicateError,
    });
    const existingInviteBuilder = buildExistingInviteBuilder({
      data: existingInvite,
      error: null,
    });
    const fromMock = vi.fn()
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(existingInviteBuilder);
    const refreshSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'fresh-access-token-2',
        },
      },
      error: null,
    });
    const getSessionMock = vi.fn();
    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const setAuthMock = vi.fn();

    createClientMock.mockReturnValue({
      from: fromMock,
      auth: {
        refreshSession: refreshSessionMock,
        getSession: getSessionMock,
      },
      functions: {
        setAuth: setAuthMock,
        invoke: invokeMock,
      },
    });

    const { createFamilyInvite } = await import('./supabase');
    const result = await createFamilyInvite(
      'family-1',
      'new@example.com',
      'familyuser',
      'user-1',
    );

    expect(result.invite.id).toBe('invite-existing');
    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(setAuthMock).toHaveBeenCalledWith('fresh-access-token-2');
    expect(invokeMock).toHaveBeenCalledWith('send-family-invite', {
      body: {
        inviteId: 'invite-existing',
        appUrl: window.location.origin,
      },
      headers: {
        Authorization: 'Bearer fresh-access-token-2',
      },
    });
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows a clear error when no session token is available for the invite email', async () => {
    const inviteRow = {
      id: 'invite-2',
      family_id: 'family-1',
      email: 'new@example.com',
      role: 'familyuser',
      created_at: '2026-04-04T10:00:00.000Z',
      accepted_at: null,
    };
    const familyInviteBuilder = buildInsertBuilder({
      data: inviteRow,
      error: null,
    });
    const refreshSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });
    const getSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });
    const invokeMock = vi.fn();
    const setAuthMock = vi.fn();

    createClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(familyInviteBuilder),
      auth: {
        refreshSession: refreshSessionMock,
        getSession: getSessionMock,
      },
      functions: {
        setAuth: setAuthMock,
        invoke: invokeMock,
      },
    });

    const { createFamilyInvite } = await import('./supabase');

    await expect(
      createFamilyInvite('family-1', 'new@example.com', 'familyuser', 'user-1'),
    ).rejects.toThrow(
      'Die Einladungs-E-Mail konnte nicht gesendet werden, weil keine gueltige Anmeldung gefunden wurde. Bitte erneut anmelden und noch einmal versuchen.',
    );

    expect(setAuthMock).not.toHaveBeenCalled();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('falls back to the stored session when refresh does not return a new token', async () => {
    const inviteRow = {
      id: 'invite-3',
      family_id: 'family-1',
      email: 'new@example.com',
      role: 'familyuser',
      created_at: '2026-04-04T10:00:00.000Z',
      accepted_at: null,
    };
    const familyInviteBuilder = buildInsertBuilder({
      data: inviteRow,
      error: null,
    });
    const refreshSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });
    const getSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'stored-access-token-3',
        },
      },
      error: null,
    });
    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const setAuthMock = vi.fn();

    createClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(familyInviteBuilder),
      auth: {
        refreshSession: refreshSessionMock,
        getSession: getSessionMock,
      },
      functions: {
        setAuth: setAuthMock,
        invoke: invokeMock,
      },
    });

    const { createFamilyInvite } = await import('./supabase');

    await createFamilyInvite('family-1', 'new@example.com', 'familyuser', 'user-1');

    expect(setAuthMock).toHaveBeenCalledWith('stored-access-token-3');
    expect(invokeMock).toHaveBeenCalledWith('send-family-invite', {
      body: {
        inviteId: 'invite-3',
        appUrl: window.location.origin,
      },
      headers: {
        Authorization: 'Bearer stored-access-token-3',
      },
    });
  });
});

describe('removeFamilyInvite', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
  });

  it('deletes a pending family invite by id', async () => {
    const deleteInviteBuilder = buildDeleteInviteBuilder({
      data: { id: 'invite-1' },
      error: null,
    });

    createClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(deleteInviteBuilder),
    });

    const { removeFamilyInvite } = await import('./supabase');

    await expect(removeFamilyInvite('invite-1')).resolves.toBeUndefined();
  });

  it('shows a clear error when the invite no longer exists', async () => {
    const deleteInviteBuilder = buildDeleteInviteBuilder({
      data: null,
      error: null,
    });

    createClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(deleteInviteBuilder),
    });

    const { removeFamilyInvite } = await import('./supabase');

    await expect(removeFamilyInvite('invite-missing')).rejects.toThrow(
      'Die Einladung konnte nicht mehr gefunden werden. Bitte aktualisiere die Ansicht.',
    );
  });
});

describe('registration controls', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
  });

  it('checks the registration gate with a normalized email address', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          registration_allowed: false,
          pending_invite: false,
          open_registration_available: false,
          has_existing_families: true,
        },
      ],
      error: null,
    });

    createClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const { fetchRegistrationGate } = await import('./supabase');
    const gate = await fetchRegistrationGate(' New.User@Example.com ');

    expect(rpcMock).toHaveBeenCalledWith('get_registration_gate', {
      target_email: 'new.user@example.com',
    });
    expect(gate).toEqual({
      allowed: false,
      hasPendingInvite: false,
      hasOpenRegistration: false,
      hasExistingFamilies: true,
    });
  });

  it('updates the family registration setting and maps the response', async () => {
    const familyUpdateBuilder = buildFamilyUpdateBuilder({
      data: {
        id: 'family-1',
        name: 'Familie Test',
        allow_open_registration: false,
      },
      error: null,
    });

    createClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(familyUpdateBuilder),
    });

    const { updateFamilyRegistrationSetting } = await import('./supabase');
    const family = await updateFamilyRegistrationSetting('family-1', false);

    expect(family).toEqual({
      familyId: 'family-1',
      familyName: 'Familie Test',
      role: 'admin',
      allowOpenRegistration: false,
    });
  });
});