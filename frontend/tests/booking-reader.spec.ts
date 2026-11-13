import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const customer = { id: 7, name: 'Reader test', email: 'reader@example.com', workspace: 'customer', systemRole: 'customer_member', organizationId: 12 };
const booking = (id: number, status = 'in_transit') => ({ id, booking_reference: `READ-${id}`, pickup_city: 'Chennai', delivery_city: 'Salem', status, payment_status: 'pending', payment_mode: 'topay', version: 2 });
const pageData = (page: number, status = 'in_transit') => ({ items: [booking(page, status)], page, nextPage: page === 1 ? 2 : null, readOnly: true });
const statusData = { authenticationAvailable: true, bookingReadsAvailable: true, bookingWritesAvailable: false, deliveryAvailable: false, crmAvailable: false };

async function signIn(page: Page) {
  await page.getByLabel('Email', { exact: true }).fill('reader@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Password123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your organization’s bookings.' })).toBeVisible();
}

async function reader(page: Page, handle: (route: Route, url: URL) => Promise<void>) {
  // Browser contract tests only. Every API request is intercepted; no live provider calls.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/status') return route.fulfill({ json: statusData });
    if (url.pathname === '/api/auth/login') return route.fulfill({ json: { authToken: 'reader-test-token', user: customer } });
    await handle(route, url);
  });
  await page.goto('http://127.0.0.1:4173/');
  await signIn(page);
}

test('booking filter resets paging; retries and refresh preserve the requested page and filter', async ({ page }) => {
  const requests: string[] = [];
  let failSecondPage = true;
  await reader(page, async (route, url) => {
    expect(route.request().method()).toBe('GET');
    expect(url.pathname).toBe('/api/bookings');
    expect(url.searchParams.has('requested_org_id')).toBe(false);
    requests.push(url.search);
    const number = Number(url.searchParams.get('page'));
    const status = url.searchParams.get('status') || 'draft';
    if (number === 2 && status === 'in_transit' && failSecondPage) return route.fulfill({ status: 503, json: { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'No successful outcome is confirmed.' } } });
    await route.fulfill({ json: status === 'cancelled' ? { items: [], page: number, nextPage: null, readOnly: true } : pageData(number, status) });
  });
  await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 · 1 booking on this page', { exact: false })).toBeVisible();
  await page.getByRole('combobox', { name: 'Booking status', exact: true }).selectOption('in_transit');
  await expect(page.getByText('Page 1 · 1 booking on this page', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /READ-1/ })).toContainText('Payment: pending');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No successful outcome');
  await expect(page.getByText('Requested page 2 · in_transit', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /READ-/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No bookings on this authorized page' })).toHaveCount(0);
  failSecondPage = false;
  await page.getByRole('button', { name: 'Retry booking read' }).click();
  await expect(page.getByRole('button', { name: /READ-2/ })).toBeVisible();
  await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
  await expect(page.getByText('Page 2 · 1 booking on this page', { exact: false })).toBeVisible();
  expect(requests.slice(-3)).toEqual(['?page=2&status=in_transit', '?page=2&status=in_transit', '?page=2&status=in_transit']);
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Booking status', exact: true }).selectOption('cancelled');
  await expect(page.getByRole('heading', { name: 'No bookings on this authorized page' })).toBeVisible();
  expect(requests.at(-1)).toBe('?page=1&status=cancelled');
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('a superseded booking read cannot overwrite the new status filter', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const oldRequestStarted = new Promise<void>(resolve => { started = resolve; });
  let finished!: () => void;
  const oldRequestFinished = new Promise<void>(resolve => { finished = resolve; });
  await reader(page, async (route, url) => {
    const status = url.searchParams.get('status');
    if (!status) {
      started();
      await held;
      try { await route.fulfill({ json: { items: [booking(99, 'draft')], page: 1, nextPage: null, readOnly: true } }); }
      finally { finished(); }
      return;
    }
    await route.fulfill({ json: pageData(1, status) });
  });
  try {
    await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
    await oldRequestStarted;
    await expect(page.getByRole('status')).toContainText('Reading authorized bookings');
    await page.getByRole('combobox', { name: 'Booking status', exact: true }).selectOption('delivered');
    await expect(page.getByRole('button', { name: /READ-1/ })).toContainText('Booking: delivered');
  } finally { release(); }
  await oldRequestFinished;
  await expect(page.getByRole('button', { name: /READ-99/ })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Booking status', exact: true })).toHaveValue('delivered');
  await expect(page.getByRole('button', { name: /READ-1/ })).toContainText('Booking: delivered');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Retry-After blocks manual read bursts and never retries automatically', async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  await reader(page, async route => {
    calls += 1;
    if (calls === 1) return route.fulfill({ status: 429, json: { error: { code: 'RATE_LIMITED', message: 'Too many requests.', retryAfter: 30 } } });
    await route.fulfill({ json: pageData(1) });
  });
  await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
  await expect(page.getByRole('alert')).toContainText('Retry after 30 seconds');
  await expect(page.getByRole('button', { name: 'Retry booking read' })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Booking status', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Load / refresh bookings' })).toBeDisabled();
  await page.clock.fastForward(29_000);
  await expect(page.getByRole('button', { name: 'Retry booking read' })).toBeDisabled();
  await page.clock.fastForward(1_000);
  await expect(page.getByRole('button', { name: 'Retry booking read' })).toBeEnabled();
  expect(calls).toBe(1);
  await expect(page.getByRole('button', { name: /READ-/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Retry booking read' }).click();
  await expect(page.getByRole('button', { name: /READ-1/ })).toBeVisible();
  expect(calls).toBe(2);
});

for (const denial of ['non-JSON 401', 'IDENTITY_UNSUPPORTED', 'AUTH_RELEASE_PENDING']) {
  test(`${denial} ends the session, clears protected UI and rechecks the access gate`, async ({ page }) => {
    let statusCalls = 0;
    let denied = false;
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/status') {
        statusCalls += 1;
        return route.fulfill({ json: { ...statusData, authenticationAvailable: !(denied && denial === 'AUTH_RELEASE_PENDING') } });
      }
      if (url.pathname === '/api/auth/login') return route.fulfill({ json: { authToken: 'reader-test-token', user: customer } });
      if (url.pathname === '/api/bookings') return route.fulfill({ json: pageData(1) });
      if (url.pathname === '/api/bookings/1') {
        denied = true;
        return route.fulfill(denial === 'non-JSON 401' ? { status: 401, contentType: 'text/html', body: '<h1>Unauthorized</h1>' } : { status: denial === 'IDENTITY_UNSUPPORTED' ? 403 : 503, json: { error: { code: denial, message: 'Account access needs verification.' } } });
      }
      throw new Error('Unexpected API route');
    });
    await page.goto('http://127.0.0.1:4173/');
    await signIn(page);
    await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
    const before = statusCalls;
    await page.getByRole('button', { name: /READ-1/ }).click();
    await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Your session has ended');
    await expect(page.getByRole('button', { name: /READ-/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
    await expect.poll(() => statusCalls).toBeGreaterThan(before);
    if (denial === 'AUTH_RELEASE_PENDING') {
      await expect(page.getByRole('button', { name: 'Sign in unavailable' })).toBeDisabled();
      await expect(page.getByLabel('Email', { exact: true })).toBeDisabled();
    } else await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
  });
}

test('a late response after sign-out cannot end or populate a newer session', async ({ page }) => {
  let logins = 0;
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const oldRequestStarted = new Promise<void>(resolve => { started = resolve; });
  let finished!: () => void;
  const oldRequestFinished = new Promise<void>(resolve => { finished = resolve; });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/status') return route.fulfill({ json: statusData });
    if (url.pathname === '/api/auth/login') {
      expect(route.request().headers().authorization).toBeUndefined();
      logins += 1;
      return route.fulfill({ json: { authToken: `reader-token-${logins}`, user: { ...customer, name: `Reader ${logins}` } } });
    }
    if (url.pathname === '/api/bookings' && route.request().headers().authorization === 'Bearer reader-token-1') {
      started();
      await held;
      try { await route.fulfill({ status: 401, json: { error: { code: 'AUTH_REQUIRED', message: 'Old session expired.' } } }); }
      finally { finished(); }
      return;
    }
    expect(route.request().headers().authorization).toBe('Bearer reader-token-2');
    await route.fulfill({ json: { ...pageData(1), items: [booking(2)] } });
  });
  try {
    await page.goto('http://127.0.0.1:4173/');
    await signIn(page);
    await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
    await oldRequestStarted;
    await expect(page.getByRole('status')).toContainText('Reading authorized bookings');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await signIn(page);
    await page.getByRole('button', { name: 'Load / refresh bookings' }).click();
    await expect(page.getByRole('button', { name: /READ-2/ })).toBeVisible();
  } finally { release(); }
  await oldRequestFinished;
  await expect(page.getByText('Zippy · Reader 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /READ-2/ })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('unreleased booking reads expose no filter actions or fixture fallback', async ({ page }) => {
  const readCalls: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/status') return route.fulfill({ json: { ...statusData, bookingReadsAvailable: false } });
    if (path === '/api/auth/login') return route.fulfill({ json: { authToken: 'reader-test-token', user: customer } });
    readCalls.push(path);
    await route.abort();
  });
  await page.goto('http://127.0.0.1:4173/?demo=1&preview=customer');
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Xano publication pending' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Booking status', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Booking reads unavailable' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toHaveCount(0);
  await expect(page.getByText('ZP-2048', { exact: false })).toHaveCount(0);
  expect(readCalls).toEqual([]);
});
