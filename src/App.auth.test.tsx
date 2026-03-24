import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  acceptPendingFamilyInvite,
  ensureProfile,
  fetchCalendarEntries,
  fetchDocuments,
  fetchFamilyContext,
  fetchFamilyInvites,
  fetchFamilyMembers,
  fetchMeals,
  fetchNotes,
  fetchShoppingItems,
  fetchTasks,
  getCurrentSession,
  signUpWithPassword,
} = vi.hoisted(() => ({
  acceptPendingFamilyInvite: vi.fn(),
  ensureProfile: vi.fn(),
  fetchCalendarEntries: vi.fn(),
  fetchDocuments: vi.fn(),
  fetchFamilyContext: vi.fn(),
  fetchFamilyInvites: vi.fn(),
  fetchFamilyMembers: vi.fn(),
  fetchMeals: vi.fn(),
  fetchNotes: vi.fn(),
  fetchShoppingItems: vi.fn(),
  fetchTasks: vi.fn(),
  getCurrentSession: vi.fn(),
  signUpWithPassword: vi.fn(),
}));

vi.mock('./lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('./lib/supabase')>('./lib/supabase');

  return {
    ...actual,
    supabaseConfigured: true,
    acceptPendingFamilyInvite,
    ensureProfile,
    fetchCalendarEntries,
    fetchDocuments,
    fetchFamilyContext,
    fetchFamilyInvites,
    fetchFamilyMembers,
    fetchMeals,
    fetchNotes,
    fetchShoppingItems,
    fetchTasks,
    getCurrentSession,
    subscribeToAuthChanges: () => () => undefined,
    signUpWithPassword,
  };
});

import App from './App';

function getAccountCard() {
  const accountEyebrow = screen.getByText('Konto');
  const accountCard = accountEyebrow.closest('.account-card');

  if (!accountCard) {
    throw new Error('Konto-Card wurde nicht gefunden.');
  }

  return within(accountCard as HTMLElement);
}

describe('App auth flow', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    acceptPendingFamilyInvite.mockReset();
    ensureProfile.mockReset();
    fetchCalendarEntries.mockReset();
    fetchDocuments.mockReset();
    fetchFamilyContext.mockReset();
    fetchFamilyInvites.mockReset();
    fetchFamilyMembers.mockReset();
    fetchMeals.mockReset();
    fetchNotes.mockReset();
    fetchShoppingItems.mockReset();
    fetchTasks.mockReset();
    getCurrentSession.mockReset();
    signUpWithPassword.mockReset();

    getCurrentSession.mockResolvedValue(null);
    fetchShoppingItems.mockResolvedValue([]);
    fetchTasks.mockResolvedValue([]);
    fetchNotes.mockResolvedValue([]);
    fetchCalendarEntries.mockResolvedValue([]);
    fetchMeals.mockResolvedValue([]);
    fetchDocuments.mockResolvedValue([]);
    fetchFamilyMembers.mockResolvedValue([]);
    fetchFamilyInvites.mockResolvedValue([]);
  });

  it('shows the confirmation message after sign-up without crashing on form reset', async () => {
    const user = userEvent.setup();
    signUpWithPassword.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<App />);

    await screen.findByRole('heading', {
      level: 1,
      name: 'Familienplaner mit echten Benutzerkonten',
    });

    await user.click(screen.getByRole('button', { name: 'Registrieren' }));
    await user.type(screen.getByPlaceholderText('Anzeigename'), 'Alex');
    await user.type(screen.getByPlaceholderText('E-Mail'), 'alex@example.com');
    await user.type(screen.getByPlaceholderText('Passwort'), 'supersecret');
    await user.click(screen.getByRole('button', { name: 'Konto anlegen' }));

    await screen.findByText(
      'Konto erstellt. Bitte bestätige jetzt die E-Mail und melde dich danach an.',
    );

    expect(signUpWithPassword).toHaveBeenCalledWith('alex@example.com', 'supersecret', 'Alex');
    expect(screen.queryByText(/can't access property "reset"/i)).not.toBeInTheDocument();
  });

  it('accepts a pending invitation during session hydration', async () => {
    getCurrentSession.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'mia@example.com',
        user_metadata: {},
      },
    });
    ensureProfile.mockResolvedValue({
      id: 'user-1',
      display_name: 'Mia',
      email: 'mia@example.com',
      role: 'familyuser',
    });
    fetchFamilyContext
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        familyId: 'family-1',
        familyName: 'Familie Test',
        role: 'familyuser',
      });
    fetchFamilyMembers.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Mia',
        email: 'mia@example.com',
        role: 'familyuser',
      },
    ]);
    acceptPendingFamilyInvite.mockResolvedValue({ id: 'invite-1' });

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Familienplaner' });

    expect(acceptPendingFamilyInvite).toHaveBeenCalledWith('user-1', 'mia@example.com');
    expect(getAccountCard().getByText('Familie Test')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Familie & Rollen' })).not.toBeInTheDocument();
  });

  it('shows a success message after a signup confirmation redirect', async () => {
    window.history.replaceState({}, '', '/#access_token=test-token&type=signup');
    getCurrentSession.mockResolvedValue({
      user: {
        id: 'user-2',
        email: 'alex@example.com',
        user_metadata: {},
      },
    });
    ensureProfile.mockResolvedValue({
      id: 'user-2',
      display_name: 'Alex',
      email: 'alex@example.com',
      role: 'admin',
    });
    fetchFamilyContext.mockResolvedValue({
      familyId: 'family-2',
      familyName: 'Familie Erfolg',
      role: 'admin',
    });
    fetchFamilyMembers.mockResolvedValue([
      {
        id: 'user-2',
        name: 'Alex',
        email: 'alex@example.com',
        role: 'admin',
      },
    ]);

    render(<App />);

    await screen.findByText('E-Mail bestätigt. Du bist jetzt erfolgreich angemeldet.');
    expect(getAccountCard().getByText('Familie Erfolg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Familie & Rollen' })).toBeInTheDocument();
  });

  it('shows family management only as an admin-only navigation module', async () => {
    const user = userEvent.setup();

    getCurrentSession.mockResolvedValue({
      user: {
        id: 'user-3',
        email: 'admin@example.com',
        user_metadata: {},
      },
    });
    ensureProfile.mockResolvedValue({
      id: 'user-3',
      display_name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
    });
    fetchFamilyContext.mockResolvedValue({
      familyId: 'family-3',
      familyName: 'Familie Admin',
      role: 'admin',
    });
    fetchFamilyMembers.mockResolvedValue([
      {
        id: 'user-3',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    ]);

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Familienplaner' });

    await user.click(screen.getByRole('button', { name: 'Familie & Rollen' }));

    expect(screen.getByRole('heading', { level: 3, name: 'Familie & Rollen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Einladung senden' })).toBeInTheDocument();
  });
});