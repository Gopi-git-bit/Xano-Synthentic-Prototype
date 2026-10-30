import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const roles = [
  { systemRole: 'driver', workspace: 'owner', title: 'Your assigned work.' },
  { systemRole: 'vendor_admin', workspace: 'owner', title: 'Your fleet workspace.' },
  { systemRole: 'operations_admin', workspace: 'admin', title: 'Operations oversight.' },
] as const;

for (const role of roles) {
  test(`${role.systemRole} shows a restricted workspace without operational provider reads`, async ({ page }) => {
    const seen: string[] = [];
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      seen.push(`${route.request().method()} ${url.pathname}`);
      if (url.pathname === '/api/status' && route.request().method() === 'GET') {
        return route.fulfill({ json: { authenticationAvailable: true, bookingReadsAvailable: false } });
      }
      if (url.pathname === '/api/auth/login' && route.request().method() === 'POST') {
        return route.fulfill({ json: { authToken: 'synthetic-role-test-token', user: {
          id: 77, name: 'Restricted test', email: 'role@example.com',
          workspace: role.workspace, systemRole: role.systemRole,
          organizationId: role.workspace === 'admin' ? null : 12,
        } } });
      }
      throw new Error(`Unexpected network access: ${url.pathname}`);
    });
    await page.goto('http://127.0.0.1:4173/');
    await page.getByLabel('Email', { exact: true }).fill('role@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: role.title })).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('data-role', role.workspace);
    await expect(page.getByText('No operational records or totals are loaded', { exact: false }))
      .toHaveCount(role.workspace === 'admin' ? 1 : 0);
    if (role.workspace === 'admin') {
      await expect(page.getByRole('heading', { name: 'Control tower unavailable' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Finance records unavailable' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Zoho is unavailable' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Assignment reads unavailable' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'POD service unavailable' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Earnings and settlements restricted' })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /confirm|refund|upload|accept job|send notification/i })).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(a11y.violations).toEqual([]);
    expect(seen).toEqual(['GET /api/status', 'POST /api/auth/login']);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
  });
}
