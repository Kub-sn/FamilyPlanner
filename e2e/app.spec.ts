import { expect, test } from '@playwright/test';

test('shows the planner shell and lets the user open the shopping module', async ({ page }) => {
  await page.goto('/');

  const plannerHeading = page.getByRole('heading', { name: 'Familienplaner' });
  const authHeading = page.getByRole('heading', { name: 'Familienplaner mit echten Benutzerkonten' });

  await expect(plannerHeading.or(authHeading)).toBeVisible();

  if (await authHeading.isVisible()) {
    await expect(page.getByRole('button', { name: 'Jetzt anmelden' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrieren' })).toBeVisible();
    return;
  }

  await expect(
    page.getByText(
      /Demo-Modus ohne Supabase-Synchronisierung\.|Lokal aktiv\. F(?:uer|ür) Synchronisierung bitte mit Supabase anmelden\./,
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Einkauf' }).click();
  await expect(page.getByRole('heading', { name: 'Einkaufsliste' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Artikel speichern' })).toBeVisible();
  await page.getByRole('button', { name: 'Notizen' }).click();
  await expect(page.getByRole('heading', { name: 'Notizen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Notiz speichern' })).toBeVisible();
  await page.getByRole('button', { name: 'Essensplan' }).click();
  await expect(page.getByRole('heading', { name: 'Essensplan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gericht speichern' })).toBeVisible();
});