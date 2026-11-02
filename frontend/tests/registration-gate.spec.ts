import { expect, test } from '@playwright/test';

test('login readiness does not expose registration or submit onboarding', async ({ page }) => {
  const calls: string[] = [];
  await page.route('**/api/**', async route => {
    calls.push(new URL(route.request().url()).pathname);
    if (calls.at(-1) === '/api/status') return route.fulfill({ json: { authenticationAvailable: true, bookingReadsAvailable: false } });
    throw new Error('Unexpected account or provider request');
  });
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByText('Registration is currently unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: /register|create account/i })).toHaveCount(0);
  await expect(page.getByLabel('Full name', { exact: true })).toHaveCount(0);
  expect(calls).toEqual(['/api/status']);
});
