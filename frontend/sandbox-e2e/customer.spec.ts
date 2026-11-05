import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { createSandboxStore } from '../server/sandbox-store.mjs';
import { sandboxTarget } from '../server/sandbox-target.mjs';
import { installProtectedPreviewRouting } from './protected-preview-route';

test('actual protected browser customer flow and security acceptance', async ({ browser }) => {
  const origin = process.env.ZIPPY_SANDBOX_BROWSER_ORIGIN!;
  const automation = process.env.ZIPPY_PREVIEW_AUTOMATION_SECRET!;
  const secrets = [automation], checks: string[] = [], bodies: string[] = [], logs: string[] = [];
  const receipts: { method: string; route: string; status: number }[] = [];
  const pending: Promise<void>[] = [];
  const evidenceDir = process.env.ZIPPY_SANDBOX_EVIDENCE_DIR || 'sandbox-test-results';
  fs.mkdirSync(evidenceDir, { recursive: true });
  const store = createSandboxStore({ url: process.env.ZIPPY_SANDBOX_REDIS_URL!, token: process.env.ZIPPY_SANDBOX_REDIS_TOKEN!,
    key: Buffer.from(process.env.ZIPPY_SANDBOX_SESSION_KEY!, 'base64'), namespace: sandboxTarget.tenant });
  const contexts: BrowserContext[] = [];
  const fixture = (label: string) => {
    const password = randomBytes(24).toString('hex') + 'Ab9'; secrets.push(password);
    return { name: 'SYNTHETIC Browser ' + label, organization: 'SYNTHETIC Browser Org ' + label, email: 'browser-' + randomUUID() + '@example.invalid', password };
  };
  async function context() {
    const c = await browser.newContext({ baseURL: origin, viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' }); contexts.push(c);
    // Forward genuine upstream responses without following redirects or synthesizing results.
    await installProtectedPreviewRouting(c, { origin, automation, onBlocked: reason => logs.push(reason) });
    const page = await c.newPage();
    page.on('console', event => logs.push(event.text()));
    page.on('pageerror', error => logs.push(error.message));
    page.on('response', response => {
      const u = new URL(response.url());
      if (u.origin === origin && u.pathname.startsWith('/api/')) {
        receipts.push({ method: response.request().method(), route: u.pathname, status: response.status() });
        pending.push(response.text().then(body => { bodies.push(body); }).catch(() => { logs.push('UNREADABLE_RESPONSE'); }));
      }
    });
    return { context: c, page };
  }
  async function api(page: Page, route: string, payload?: object) {
    const csrfCookie = (await page.context().cookies()).find(c => c.name === '__Host-zippy-sandbox-csrf');
    return page.evaluate(async ({ route, payload, currentCsrf }) => {
      let csrf = currentCsrf;
      if (payload && !csrf) csrf = (await (await fetch('/api/sandbox/csrf', { credentials: 'same-origin' })).json()).csrf;
      const result = await fetch('/api/sandbox/' + route, { method: payload ? 'POST' : 'GET', credentials: 'same-origin',
        headers: payload ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      return { status: result.status, data: await result.json() };
    }, { route, payload, currentCsrf: csrfCookie?.value.split('.')[0] || '' });
  }
  async function onboard(page: Page, value: ReturnType<typeof fixture>) {
    await page.goto('/?sandbox=1');
    await expect(page.locator('[data-sandbox-preview="xano-gateway"]')).toBeVisible();
    await page.getByLabel('Full name').fill(value.name); await page.getByLabel('Organization name').fill(value.organization);
    await page.getByLabel('Test email').fill(value.email); await page.getByLabel('Test password').fill(value.password);
    await page.getByRole('button', { name: 'Continue to sign in' }).click();
    await expect(page.getByText('Sandbox registration completed.', { exact: false })).toBeVisible();
    await page.getByLabel('Test password').fill(value.password); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByTestId('active-organization')).toContainText(value.organization);
  }
  async function rememberToken(c: BrowserContext) {
    const cookie = (await c.cookies()).find(x => x.name === '__Host-zippy-sandbox');
    expect(Boolean(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Strict' && cookie.path === '/')).toBe(true);
    expect(Boolean(cookie && /^[A-Za-z0-9_-]{43}$/.test(cookie.value))).toBe(true);
    const record = await store.get(cookie!.value); expect(Boolean(record?.token)).toBe(true); secrets.push(record!.token);
    return { cookie: cookie!, record: record! };
  }
  async function makeDraft(page: Page) {
    let input: Record<string, unknown> = {};
    const capture = (request: import('@playwright/test').Request) => {
      if (new URL(request.url()).pathname === '/api/sandbox/bookings' && request.method() === 'POST') input = request.postDataJSON();
    };
    page.on('request', capture);
    await page.getByRole('navigation').getByRole('button', { name: 'Create draft' }).click();
    for (const [label, value] of [['Pickup city', 'Synthetic Origin'], ['Delivery city', 'Synthetic Destination'], ['Pickup street', 'Synthetic Pickup'], ['Delivery street', 'Synthetic Delivery']]) await page.getByLabel(label).fill(value);
    for (const label of ['Quote unavailable', 'Pay unavailable', 'Dispatch unavailable']) await expect(page.getByRole('button', { name: label })).toBeDisabled();
    await page.getByRole('button', { name: 'Save synthetic draft' }).click();
    await expect(page.getByText('Draft saved and retrieved from isolated Xano.', { exact: false })).toBeVisible();
    page.off('request', capture);
    const list = await api(page, 'bookings'); expect(list.status).toBe(200); expect(list.data.items.length).toBe(1);
    const booking = list.data.items[0];
    await page.getByRole('button', { name: 'View draft ' + booking.reference }).click();
    await expect(page.getByRole('heading', { name: booking.reference })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm unavailable' })).toBeDisabled();
    return { booking, input };
  }
  let a: Awaited<ReturnType<typeof context>> | undefined, b: Awaited<ReturnType<typeof context>> | undefined;
  try {
    await test.step('protected preview and exact deployment preflight', async () => {
      expect(Date.now() < sandboxTarget.expiresAt).toBe(true);
      const unauthenticated = await fetch(origin + '/?sandbox=1', { redirect: 'manual' }); expect([302, 401].includes(unauthenticated.status)).toBe(true);
      const response = await fetch(origin + '/api/sandbox/csrf', { headers: { 'x-vercel-protection-bypass': automation }, redirect: 'error' });
      expect(response.status).toBe(200); const data = await response.json();
      expect(data.mode).toBe('isolated_xano_gateway'); expect(data.frontendCommit).toBe(process.env.ZIPPY_SANDBOX_EXPECTED_COMMIT);
      expect(data.version).toBe('0.3.0-sandbox-browser'); checks.push('protected_exact_preview');
    });
    a = await context(); b = await context();
    const aFixture = fixture('A'), bFixture = fixture('B');
    await test.step('registration, pending review, authenticated identity and membership', async () => {
      await onboard(a!.page, aFixture); await onboard(b!.page, bFixture);
      const identity = await api(a!.page, 'auth/me'), membership = await api(a!.page, 'organization/membership');
      expect(identity.status).toBe(200); expect(membership.status).toBe(200);
      expect(identity.data.organization.id === membership.data.organization.id && membership.data.membership.active === true).toBe(true);
      expect(membership.data.organization.verification).toBe('pending_human_review'); checks.push('registration', 'login_identity', 'membership');
    });
    const aState = await rememberToken(a.context), bState = await rememberToken(b.context);
    // Deployment test TTL must be 60–180 seconds so real expiry is exercised, not mocked.
    expect(bState.record.expiresAt - Date.now() <= 180000).toBe(true);
    const aDraft = await makeDraft(a.page), bDraft = await makeDraft(b.page); checks.push('draft_created', 'list_detail');
    await test.step('idempotency and cross-organization authorization', async () => {
      const replay = await api(a!.page, 'bookings', aDraft.input); expect(replay.status).toBe(200);
      expect(replay.data.booking.id === aDraft.booking.id).toBe(true); expect((await api(a!.page, 'bookings')).data.items.length).toBe(1);
      const foreign = await api(a!.page, 'bookings/' + bDraft.booking.id), missing = await api(a!.page, 'bookings/2147483647');
      expect(foreign.status).toBe(404); expect(JSON.stringify(foreign.data) === JSON.stringify(missing.data)).toBe(true);
      expect((await api(b!.page, 'bookings/' + aDraft.booking.id)).status).toBe(404); checks.push('idempotency', 'organization_isolation');
    });
    await test.step('disabled operations, CSRF, caller authority and responsive browser security', async () => {
      for (const route of ['payments', 'refunds', 'dispatch', 'mcp', 'metadata', 'debug', 'bookings/' + aDraft.booking.id + '/confirm']) expect((await api(a!.page, route, {})).status).toBe(404);
      expect((await api(a!.page, 'bookings', { ...aDraft.input, status: 'booked', total_amount: 100 })).status).toBe(400);
      const csrfDenied = await a!.page.evaluate(async () => (await fetch('/api/sandbox/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
      expect(csrfDenied).toBe(403);
      for (const width of [320, 390, 1440]) {
        await a!.page.setViewportSize({ width, height: 900 });
        expect(await a!.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const scan = await new AxeBuilder({ page: a!.page }).analyze(); expect(scan.violations.filter(v => ['serious', 'critical'].includes(v.impact || '')).length).toBe(0);
      }
      checks.push('operational_denials', 'csrf', 'mobile_320_390_desktop');
    });
    await test.step('logout revokes even a replayed opaque cookie; invalid credentials are denied', async () => {
      await a!.page.getByRole('button', { name: 'Sign out' }).click(); await expect(a!.page.getByText('Signed out. The server session was revoked.')).toBeVisible();
      await a!.context.addCookies([aState.cookie]); expect((await api(a!.page, 'auth/me')).status).toBe(401);
      expect((await api(a!.page, 'auth/login', { email: aFixture.email, password: 'WrongSyntheticPassword123' })).status).toBe(401);
      checks.push('logout_replay_denied', 'invalid_credentials');
    });
    await test.step('real shared-store revocation and server-clock expiration', async () => {
      // Re-login via the genuine gateway, revoke only this synthetic session in shared state.
      expect((await api(a!.page, 'auth/login', { email: aFixture.email, password: aFixture.password })).status).toBe(200);
      const newState = await rememberToken(a!.context); await store.delete(newState.cookie.value);
      expect((await api(a!.page, 'bookings')).status).toBe(401);
      const delay = Math.max(0, bState.record.expiresAt - Date.now() + 1000);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Browser cookie expiry must not be the sole gate: replay with a later browser expiry.
      await b!.context.addCookies([{ ...bState.cookie, expires: Math.floor(Date.now() / 1000) + 600 }]);
      expect((await api(b!.page, 'auth/me')).status).toBe(401); checks.push('revoked_session', 'expired_session');
    });
    await test.step('no browser storage, URL, console or response secret leakage', async () => {
      await Promise.all(pending);
      for (const c of [a!, b!]) {
        const stored = await c.page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
        expect(secrets.every(s => !stored.includes(s))).toBe(true);
        expect(await c.page.evaluate(() => Object.keys(localStorage).length + Object.keys(sessionStorage).length)).toBe(0);
        expect(secrets.every(s => !c.page.url().includes(s))).toBe(true);
      }
      expect(logs.includes('FORBIDDEN_BROWSER_EGRESS')).toBe(false);
      expect(logs.includes('FORBIDDEN_BROWSER_REDIRECT')).toBe(false);
      expect(logs.includes('PROTECTED_REQUEST_FAILED')).toBe(false);
      expect(secrets.every(s => !JSON.stringify(logs).includes(s) && !JSON.stringify(bodies).includes(s))).toBe(true);
      checks.push('secret_exclusion');
    });
  } finally {
    await Promise.all(pending);
    fs.writeFileSync(path.join(evidenceDir, 'browser-http.json'), JSON.stringify({ at: new Date().toISOString(), origin, frontendCommit: process.env.ZIPPY_SANDBOX_EXPECTED_COMMIT,
      backendCommit: sandboxTarget.backendCommit, tenant: sandboxTarget.tenant, tenantId: sandboxTarget.tenantId, checks, receipts,
      backend_responses_simulated: false, scope: 'Actual upstream requests forwarded to browser unchanged; protection header sent only to exact preview origin; all redirects blocked before delivery' }, null, 2) + '\n');
    await Promise.all(contexts.map(c => c.close()));
  }
});