import { expect, test, type Page, type Route } from '@playwright/test';

const supabaseBaseUrl = 'https://aachyijzixdeupeqcdvk.supabase.co';
const recoverySession = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXJlY292ZXJ5IiwiZW1haWwiOiJhbGV4QGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature',
  refresh_token: 'refresh-token-recovery',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-recovery',
    email: 'alex@example.com',
    user_metadata: {},
  },
};

async function mockSupabaseAuth(page: Page) {
  await page.route(`${supabaseBaseUrl}/auth/v1/**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.endsWith('/auth/v1/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(recoverySession.user),
      });
      return;
    }

    if (url.pathname.endsWith('/auth/v1/token')) {
      const grantType = url.searchParams.get('grant_type');

      if (grantType === 'password' || grantType === 'refresh_token') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(recoverySession),
        });
        return;
      }
    }

    if (url.pathname.endsWith('/auth/v1/logout')) {
      await route.fulfill({
        status: 204,
        body: '',
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.route(`${supabaseBaseUrl}/rest/v1/**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split('/').pop();
    const select = url.searchParams.get('select') ?? '';
    const acceptsObject = request.headers().accept?.includes('application/vnd.pgrst.object+json');

    let body: unknown = [];

    if (table === 'profiles' && acceptsObject) {
      body = {
        id: 'user-recovery',
        display_name: 'Alex',
        email: 'alex@example.com',
        role: 'familyuser',
      };
    } else if (table === 'profiles') {
      body = [
        {
          id: 'user-recovery',
          display_name: 'Alex',
          email: 'alex@example.com',
        },
      ];
    } else if (table === 'family_members' && (acceptsObject || select.includes('family:families'))) {
      body = {
        family_id: 'family-1',
        role: 'familyuser',
        family: {
          id: 'family-1',
          name: 'Familie Test',
        },
      };
    } else if (table === 'family_members') {
      body = [
        {
          user_id: 'user-recovery',
          role: 'familyuser',
        },
      ];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.route(`${supabaseBaseUrl}/functions/v1/**`, async (route: Route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith('/functions/v1/delete-own-account')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

async function mockSupabasePasswordRecovery(page: Page) {
  await page.route(`${supabaseBaseUrl}/auth/v1/**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.endsWith('/auth/v1/recover')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

test('shows the planner shell and lets the user open the shopping module', async ({ page }) => {
  await page.goto('/');

  const plannerHeading = page.getByRole('heading', { name: 'Frey Frey' });
  const authHeading = page.getByRole('heading', { name: 'Frey Frey mit echten Benutzerkonten' });

  await expect(plannerHeading.or(authHeading)).toBeVisible();

  if (await authHeading.isVisible()) {
    await expect(page.getByRole('button', { name: 'Jetzt anmelden' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrieren' })).toBeVisible();
    return;
  }

  await expect(page.getByText('Demo-Modus')).toBeVisible();
  await page.getByRole('button', { name: 'Einkauf' }).click();
  await expect(page.getByRole('heading', { name: 'Neuen Artikel hinzufügen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Artikel speichern' })).toBeVisible();
  await page.getByRole('button', { name: 'Notizen' }).click();
  await expect(page.getByRole('heading', { name: 'Neue Notiz' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Notiz speichern' })).toBeVisible();
  await page.getByRole('button', { name: 'Essensplan' }).click();
  await expect(page.getByRole('heading', { name: 'Gericht eintragen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gericht speichern' })).toBeVisible();
});

test('lets the user complete the password reset flow and sign in afterwards', async ({ page }) => {
  await mockSupabaseAuth(page);

  await page.goto(
    '/auth/reset-password#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXJlY292ZXJ5IiwiZW1haWwiOiJhbGV4QGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature&refresh_token=refresh-token-recovery&expires_in=3600&token_type=bearer&type=recovery',
  );

  await expect(page.getByRole('heading', { name: 'Frey Frey mit echten Benutzerkonten' })).toBeVisible();
  await expect(page.getByPlaceholder('Neues Passwort')).toBeVisible();
  await expect(page.getByPlaceholder('Passwort wiederholen')).toBeVisible();

  await page.getByPlaceholder('Neues Passwort').fill('supersecret2');
  await page.getByPlaceholder('Passwort wiederholen').fill('supersecret2');
  await page.getByRole('button', { name: 'Passwort speichern' }).click();

  await expect(page.getByText('Passwort erfolgreich aktualisiert.')).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await expect(page.getByRole('button', { name: 'Jetzt anmelden' })).toBeVisible();

  await page.getByPlaceholder('E-Mail').fill('alex@example.com');
  await page.getByPlaceholder('Passwort').fill('supersecret2');
  await page.getByRole('button', { name: 'Jetzt anmelden' }).click();

  await expect(page.getByRole('heading', { name: 'Frey Frey' })).toBeVisible();
  await expect(page.getByText('Familie Test', { exact: true }).first()).toBeVisible();
});

test('lets the user request a password reset email from the sign-in screen', async ({ page }) => {
  await mockSupabasePasswordRecovery(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Frey Frey mit echten Benutzerkonten' })).toBeVisible();

  await page.getByPlaceholder('E-Mail').fill('alex@example.com');
  await page.getByRole('button', { name: 'Passwort vergessen?' }).click();
  await expect(page.getByRole('button', { name: 'Reset-Link senden' })).toBeVisible();

  await page.getByRole('button', { name: 'Reset-Link senden' }).click();

  await expect(
    page.getByText('Wenn ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen verschickt.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jetzt anmelden' })).toBeVisible();
});

test('asks for confirmation before deleting the account and lets the user cancel', async ({ page }) => {
  await mockSupabaseAuth(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Frey Frey mit echten Benutzerkonten' })).toBeVisible();

  await page.getByPlaceholder('E-Mail').fill('alex@example.com');
  await page.getByPlaceholder('Passwort').fill('supersecret2');
  await page.getByRole('button', { name: 'Jetzt anmelden' }).click();

  await expect(page.getByRole('heading', { name: 'Frey Frey' })).toBeVisible();

  await page.getByRole('button', { name: 'Account löschen' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Bist du sicher?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ja, Account löschen' })).toBeVisible();

  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Frey Frey' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account löschen' })).toBeVisible();
});