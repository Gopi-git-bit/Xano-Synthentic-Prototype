import { expect, test, type Page } from '@playwright/test';

async function registerAndLogin(page: Page) {
  await page.goto('/?sandbox=1');
  await expect(page.getByRole('heading', { name: 'Start your freight journey.' })).toBeVisible();
  await page.getByLabel('Full name').fill('SYNTHETIC Customer');
  await page.getByLabel('Organization name').fill('SYNTHETIC Textile Ltd');
  await page.getByLabel('Test email').fill('synthetic-check@example.invalid');
  await page.getByLabel('Test password').fill('SamplePassword1234');
  await page.getByRole('button', { name: 'Continue to sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back to Zippy.' })).toBeVisible();
  await page.getByLabel('Test password').fill('SamplePassword1234');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your next move, made simple.' })).toBeVisible();
}

test('sandbox rehearsal covers registration, login, draft and detail without API traffic', async ({ page }) => {
  const apiCalls: string[] = [];
  await page.route('**/api/**', async route => { apiCalls.push(route.request().url()); await route.abort(); });
  await registerAndLogin(page);
  await page.getByRole('navigation', { name: 'Sandbox customer navigation' }).getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByRole('button', { name: 'Quote unavailable' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Pay unavailable' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Dispatch unavailable' })).toBeDisabled();
  await page.getByLabel('Pickup city').fill('Synthetic Chennai');
  await page.getByLabel('Delivery city').fill('Synthetic Hosur');
  await page.getByLabel('Pickup street').fill('Synthetic Street 1');
  await page.getByLabel('Delivery street').fill('Synthetic Street 2');
  await page.getByRole('button', { name: 'Save synthetic draft' }).click();
  await expect(page.getByText('SYN-DRAFT-001')).toBeVisible();
  await page.getByRole('button', { name: 'View draft SYN-DRAFT-001' }).click();
  await expect(page.getByText('Pending · not collected')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm unavailable' })).toBeDisabled();
  expect(apiCalls).toEqual([]);
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
});

test('invalid customer details are rejected, and expired test session clears drafts', async ({ page }) => {
  await page.goto('/?sandbox=1');
  await page.getByLabel('Full name').fill('Real User');
  await page.getByLabel('Organization name').fill('Actual Enterprise');
  await page.getByLabel('Test email').fill('real@company.com');
  await page.getByLabel('Test password').fill('ExamplePassword123');
  await page.getByRole('button', { name: 'Continue to sign in' }).click();
  await expect(page.getByRole('alert')).toContainText('@example.invalid');
  await registerAndLogin(page);
  await page.getByRole('button', { name: 'Expire synthetic session' }).click();
  await expect(page.getByRole('heading', { name: 'Start your freight journey.' })).toBeVisible();
  await expect(page.getByText('Synthetic session expired', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'My drafts' })).toHaveCount(0);
});

test('sandbox customer preview stays responsive at a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 820 });
  await registerAndLogin(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('navigation', { name: 'Sandbox customer navigation' }).getByRole('button', { name: 'Create draft' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('standard production build does not expose synthetic onboarding with sandbox query', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/?sandbox=1');
  await expect(page.getByText('Registration is currently unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start your freight journey.' })).toHaveCount(0);
  await expect(page.getByRole('form', { name: 'Synthetic customer registration' })).toHaveCount(0);
});
