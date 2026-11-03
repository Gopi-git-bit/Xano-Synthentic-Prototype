import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Explicit UI mocks. These tests are not browser-to-Xano acceptance.
async function mockedGateway(page: Page, options: { uncertainDraft?: boolean; unavailable?: boolean } = {}) {
  let loggedIn = false, failDraft = Boolean(options.uncertainDraft);
  const requestIds: string[] = [], drafts: object[] = [];
  const session = () => ({ user: { id: 1, name: 'SYNTHETIC Customer', email: 'mock-ui@example.invalid' }, organization: { id: 1, name: 'SYNTHETIC Textiles', verification: 'pending_human_review' }, membership: { role: 'owner', active: true }, bookingScope: 'draft_only', expiresAt: Date.now() + 60000 });
  await page.route('**/api/sandbox/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/sandbox/', ''), method = route.request().method();
    const input = route.request().postDataJSON() as Record<string, unknown> | null;
    const reply = (status: number, data: object) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (options.unavailable) return reply(503, { error: { code: 'SANDBOX_DISABLED' } });
    if (path === 'csrf') return reply(200, { csrf: 'mock-csrf' });
    if (path === 'auth/register') return reply(201, { verification: 'pending_human_review' });
    if (path === 'auth/login') { loggedIn = true; return reply(200, { ...session(), csrf: 'mock-login-csrf' }); }
    if (path === 'auth/logout') { loggedIn = false; return reply(200, { loggedOut: true }); }
    if (!loggedIn) return reply(401, { error: { code: 'SESSION_REQUIRED' } });
    if (path === 'auth/me' || path === 'organization/membership') return reply(200, session());
    if (path === 'bookings' && method === 'POST') {
      requestIds.push(String(input?.request_id));
      expect(Object.keys(input || {}).sort()).toEqual(['request_id', 'pickup_city', 'pickup_street', 'delivery_city', 'delivery_street', 'pickup_window_start', 'pickup_window_end', 'delivery_window_start', 'delivery_window_end'].sort());
      const booking = { id: 1, reference: 'DRAFT-UI-MOCK', pickupCity: 'Synthetic Chennai', deliveryCity: 'Synthetic Hosur', version: 1, status: 'draft' };
      if (!drafts.length) drafts.push(booking);
      if (failDraft) { failDraft = false; return reply(502, { error: { code: 'UNCONFIRMED' } }); }
      return reply(200, { booking });
    }
    if (path === 'bookings') return reply(200, { items: drafts, nextPage: null });
    if (path === 'bookings/1') return reply(200, { booking: drafts[0] });
    return reply(404, { error: { code: 'DISABLED' } });
  });
  return { requestIds, revoke: () => { loggedIn = false; } };
}
async function login(page: Page) {
  await page.goto('/?sandbox=1&sandboxBackend=gateway');
  await page.getByLabel('Full name').fill('SYNTHETIC Customer');
  await page.getByLabel('Organization name').fill('SYNTHETIC Textiles');
  await page.getByLabel('Test email').fill('mock-ui@example.invalid');
  await page.getByLabel('Test password').fill('MockUiPassword123!');
  await page.getByRole('button', { name: 'Continue to sign in' }).click();
  await expect(page.getByText('Sandbox registration completed.', { exact: false })).toBeVisible();
  await page.getByLabel('Test password').fill('MockUiPassword123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByTestId('active-organization')).toContainText('SYNTHETIC Textiles');
}
async function fillDraft(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: 'Create draft' }).click();
  for (const [label, value] of [['Pickup city', 'Synthetic Chennai'], ['Delivery city', 'Synthetic Hosur'], ['Pickup street', 'Synthetic Street 1'], ['Delivery street', 'Synthetic Street 2']]) await page.getByLabel(label).fill(value);
}
for (const width of [320, 390, 1440]) test(`mock gateway UI workflow and browser security scan at ${width}px`, async ({ page }) => {
  const urls: string[] = [], logs: string[] = [];
  page.on('request', request => urls.push(request.url()));
  page.on('console', event => logs.push(event.text()));
  await page.setViewportSize({ width, height: 900 }); await mockedGateway(page); await login(page); await fillDraft(page);
  for (const label of ['Quote unavailable', 'Pay unavailable', 'Dispatch unavailable']) await expect(page.getByRole('button', { name: label })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations.filter(v => ['critical', 'serious'].includes(v.impact || '')).map(v => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Save synthetic draft' }).click();
  await page.getByRole('button', { name: 'View draft DRAFT-UI-MOCK' }).click();
  await expect(page.getByRole('heading', { name: 'DRAFT-UI-MOCK' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm unavailable' })).toBeDisabled();
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
  expect(urls.every(url => new URL(url).origin === 'http://127.0.0.1:5174')).toBe(true);
  expect(JSON.stringify({ urls, logs }).includes('MockUiPassword123!')).toBe(false);
  expect(await page.locator('input[type="password"]').count()).toBe(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByText('Signed out. The server session was revoked.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'My drafts' })).toHaveCount(0);
});
test('mock uncertain draft retry reuses UUID and creates one displayed booking', async ({ page }) => {
  const h = await mockedGateway(page, { uncertainDraft: true }); await login(page); await fillDraft(page);
  await page.getByRole('button', { name: 'Save synthetic draft' }).click(); await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Save synthetic draft' }).click();
  await expect(page.getByRole('button', { name: 'View draft DRAFT-UI-MOCK' })).toHaveCount(1);
  expect(h.requestIds.length).toBe(2); expect(h.requestIds[0] === h.requestIds[1]).toBe(true);
});
test('mock revoked server session clears protected UI without stale drafts', async ({ page }) => {
  const h = await mockedGateway(page); await login(page); h.revoke();
  await page.getByRole('button', { name: 'My drafts' }).click();
  await expect(page.getByRole('alert')).toContainText('Session expired');
  await expect(page.getByRole('button', { name: 'My drafts' })).toHaveCount(0);
});
test('mock expiry timer clears session and sensitive input', async ({ page }) => {
  await page.clock.install(); await mockedGateway(page); await login(page);
  await page.clock.fastForward(61000);
  await expect(page.getByText('Sandbox session expired. Sign in again.')).toBeVisible();
  await expect(page.getByLabel('Test password')).toHaveValue('');
});
test('unavailable gateway is explicit and never falls back to an in-memory successful flow', async ({ page }) => {
  await mockedGateway(page, { unavailable: true }); await page.goto('/?sandbox=1&sandboxBackend=gateway');
  await expect(page.getByRole('alert')).toContainText('Protected sandbox is unavailable');
  await expect(page.getByRole('heading', { name: 'Your next move, made simple.' })).toHaveCount(0);
});
