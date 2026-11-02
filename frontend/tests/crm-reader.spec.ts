import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createGateway } from '../server/gateway.mjs';

const moduleNames = ['Accounts', 'Contacts', 'Leads', 'Deals', 'Tasks', 'Events', 'Custom_Relationships'];
const ids = Array.from({ length: 11 }, (_, i) => String(100 + i));
const grant = { recordIds: ids, fields: ['Display_Name', 'Approved', 'Owner'] };
const reply = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
type Control = {
  role?: string;
  expired?: boolean;
  env?: Record<string, string | undefined>;
  now?: () => number;
  override?: (url: URL) => Promise<Response | undefined> | Response | undefined;
};
async function harness(page: Page, control: Control = {}) {
  const env = { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_AUTH_RELEASE: 'verified', ZOHO_READ_RELEASE: 'verified', ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in', ZOHO_CLIENT_ID: 'synthetic-client', ZOHO_CLIENT_SECRET: 'synthetic-secret', ZOHO_REFRESH_TOKEN: 'synthetic-refresh', CRM_READ_GRANTS_JSON: JSON.stringify({ 7: Object.fromEntries(moduleNames.map(module => [module, grant])) }), ...control.env };
  const upstream: URL[] = [];
  const requests: URL[] = [];
  const handle = createGateway({ env, now: control.now, fetchImpl: async (input, init) => {
    const url = new URL(String(input)); upstream.push(url);
    const override = await control.override?.(url);
    if (override) return override;
    if (url.pathname.endsWith('/auth/login')) return reply({ authToken: 'synthetic-session' });
    if (url.pathname.endsWith('/auth/me')) return control.expired ? reply({}, 401) : reply({ id: 7, name: 'Synthetic CRM Admin', email: 'crm@example.test', system_role: control.role || 'operations_admin', status: 'active', active_organization_id: 12 });
    if (url.pathname.endsWith('/oauth/v2/token')) return reply({ access_token: 'synthetic-access', expires_in: 3600, api_domain: 'https://www.zohoapis.in' });
    expect(init?.method || 'GET').toBe('GET');
    if (url.pathname.endsWith('/settings/modules')) return reply({ modules: [...moduleNames, 'Invoices'].map(api_name => ({ api_name, plural_label: api_name === 'Contacts' ? 'People' : api_name, api_supported: true, viewable: true, status: 'visible' })) });
    if (url.pathname.endsWith('/settings/fields')) return reply({ fields: grant.fields.map(api_name => ({ api_name, visible: true })) });
    const id = url.pathname.split('/').at(-1)!;
    expect(ids).toContain(id);
    expect(url.searchParams.get('fields')).toBe(grant.fields.join(','));
    return reply({ data: [{ id, Display_Name: `Synthetic relationship ${id}`, Approved: false, Owner: { name: 'Hidden nested person' }, Secret_Field: 'Forbidden value' }] });
  } });
  // Full production UI -> real gateway -> synthetic provider. No live provider network exists here.
  await page.route('**/api/**', async route => {
    const req = route.request(); const url = new URL(req.url()); requests.push(url);
    const result = await handle({ url: url.href, method: req.method(), headers: new Headers(await req.allHeaders()), body: req.postDataJSON() ?? undefined });
    await route.fulfill({ status: result.status, json: result.data, headers: result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {} });
  });
  await page.goto('http://127.0.0.1:4173/');
  await page.getByLabel('Email', { exact: true }).fill('crm@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Password123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  return { env, upstream, requests };
}
const chooseContacts = (page: Page) => page.getByRole('combobox', { name: 'Module filter' }).selectOption('Contacts');

test('Admin uses actual gateway module grants, page-local search, pagination and projected record detail', async ({ page }) => {
  const { upstream, requests } = await harness(page);
  const selector = page.getByRole('combobox', { name: 'Module filter' });
  await expect(selector).toBeVisible();
  expect(await selector.locator('option').allTextContents()).toEqual(['Select an available module', 'Accounts', 'People', 'Leads', 'Deals', 'Tasks', 'Events', 'Custom_Relationships']);
  expect(upstream.filter(url => /\/\d+$/.test(url.pathname))).toHaveLength(0);
  await chooseContacts(page);
  await expect(page.getByText('Page 1 · 10 authorized records on this page', { exact: false })).toBeVisible();
  const before = requests.length;
  await page.getByLabel('Search this authorized page').fill('relationship 109');
  await expect(page.getByRole('button', { name: /View authorized fields/ })).toHaveCount(1);
  expect(requests.length).toBe(before);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 · 1 authorized records on this page', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /Synthetic relationship 110/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Synthetic relationship 110');
  await expect(dialog).toContainText('false');
  await expect(dialog).toContainText('Not available');
  await expect(dialog).toContainText('Related Zippy orders: unavailable');
  await expect(page.locator('body')).not.toContainText('Hidden nested person');
  await expect(page.locator('body')).not.toContainText('Forbidden value');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Refresh CRM', exact: true }).click();
  await expect(page.getByRole('button', { name: /Synthetic relationship 110/ })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  expect(requests.every(url => ['/api/status', '/api/auth/login', '/api/crm/modules', '/api/crm/records', '/api/crm/record'].includes(url.pathname))).toBe(true);
  expect(upstream.filter(url => url.hostname === 'xano.example').every(url => /\/auth\/(login|me)$/.test(url.pathname))).toBe(true);
});

for (const [label, env] of Object.entries({ 'blocked release': { ZOHO_READ_RELEASE: 'blocked' }, 'missing REST credential': { ZOHO_CLIENT_SECRET: '' }, 'missing grants': { CRM_READ_GRANTS_JSON: '{}' } })) {
  test(`${label} never shows module selection or reads Zoho records`, async ({ page }) => {
    const { upstream } = await harness(page, { env });
    await expect(page.getByRole('heading', { name: 'Zoho is unavailable' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Module filter' })).toHaveCount(0);
    expect(upstream.every(url => url.hostname === 'xano.example')).toBe(true);
  });
}

test('failed connection is not available despite configured credentials and release flag', async ({ page }) => {
  await harness(page, { override: url => url.pathname.endsWith('/settings/modules') ? reply({ message: 'hidden provider diagnostic' }, 403) : undefined });
  await expect(page.getByRole('alert')).toContainText('Zoho denied this operation');
  await expect(page.getByRole('combobox', { name: 'Module filter' })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('hidden provider diagnostic');
});

test('successful empty module and record results have explicit empty states', async ({ page }) => {
  const control: Control = { env: { CRM_READ_GRANTS_JSON: JSON.stringify({ 7: {} }) } };
  const instance = await harness(page, control);
  await expect(page.getByRole('heading', { name: 'No modules available' })).toBeVisible();
  instance.env.CRM_READ_GRANTS_JSON = JSON.stringify({ 7: { Contacts: { ...grant, recordIds: [] } } });
  await page.getByRole('button', { name: 'Recheck CRM access' }).click();
  await chooseContacts(page);
  await expect(page.getByRole('heading', { name: 'No matching records on this page' })).toBeVisible();
  expect(instance.upstream.filter(url => /\/Contacts\/\d+$/.test(url.pathname))).toHaveLength(0);
});

test('page failure and retry preserve requested page; malformed provider data is not empty success', async ({ page }) => {
  let failed = true;
  await harness(page, { override: url => failed && url.pathname.endsWith('/Contacts/110') ? reply({ data: null }) : undefined });
  await chooseContacts(page);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('response could not be verified');
  await expect(page.getByText('Requested page 2 · Contacts', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /View authorized fields/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No matching records on this page' })).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Retry CRM read' }).click();
  await expect(page.getByRole('button', { name: /Synthetic relationship 110/ })).toBeVisible();
});

test('rate limits disable manual requests and expiry does not automatically read', async ({ page }) => {
  await page.clock.install();
  let clock = Date.now();
  let limited = true;
  const { requests } = await harness(page, { now: () => clock, override: url => limited && url.pathname.endsWith('/Contacts/100') ? reply({}, 429, { 'Retry-After': '1' }) : undefined });
  await chooseContacts(page);
  await expect(page.getByRole('alert')).toContainText('Retry after 1 seconds');
  const retry = page.getByRole('button', { name: 'Retry CRM read' });
  await expect(retry).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Module filter' })).toBeDisabled();
  const count = requests.length;
  clock += 2000;
  await page.clock.fastForward(2000);
  await expect(retry).toBeEnabled();
  expect(requests.length).toBe(count);
  limited = false;
  await retry.click();
  await expect(page.getByRole('button', { name: /Synthetic relationship 100/ })).toBeVisible();
});

test('record grants revoked after list success remove displayed data and module access', async ({ page }) => {
  const { env, upstream } = await harness(page);
  await chooseContacts(page);
  await expect(page.getByRole('button', { name: /Synthetic relationship 100/ })).toBeVisible();
  env.CRM_READ_GRANTS_JSON = '{}';
  const before = upstream.length;
  await page.getByRole('button', { name: /Synthetic relationship 100/ }).click();
  await expect(page.getByRole('alert')).toContainText('No CRM record scope');
  await expect(page.getByRole('combobox', { name: 'Module filter' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /View authorized fields/ })).toHaveCount(0);
  expect(upstream.slice(before).every(url => url.hostname === 'xano.example')).toBe(true);
});

test('expired Xano session clears CRM and returns to sign-in', async ({ page }) => {
  const control: Control = {};
  await harness(page, control);
  await chooseContacts(page);
  await expect(page.getByRole('button', { name: /Synthetic relationship 100/ })).toBeVisible();
  control.expired = true;
  await page.getByRole('button', { name: /Synthetic relationship 100/ }).click();
  await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Your session has ended');
  await expect(page.locator('body')).not.toContainText('Synthetic relationship');
});

test('revoked Admin role hides CRM controls and clears records on the next read', async ({ page }) => {
  const control: Control = {};
  await harness(page, control);
  await chooseContacts(page);
  await expect(page.getByRole('button', { name: /Synthetic relationship 100/ })).toBeVisible();
  control.role = 'customer_member';
  await page.getByRole('button', { name: /Synthetic relationship 100/ }).click();
  await expect(page.getByRole('alert')).toContainText('Admin authorization is required');
  await expect(page.getByRole('combobox', { name: 'Module filter' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /View authorized fields/ })).toHaveCount(0);
});

test('superseded module response and late sign-out response cannot reveal old CRM records', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const pending = new Promise<void>(resolve => { started = resolve; });
  const control: Control = { override: async url => { if (url.pathname.endsWith('/Contacts/100')) { started(); await held; } return undefined; } };
  await harness(page, control);
  await chooseContacts(page);
  await pending;
  await expect(page.getByRole('status')).toContainText('Loading authorized CRM data');
  await page.getByRole('combobox', { name: 'Module filter' }).selectOption('Accounts');
  await expect(page.getByRole('button', { name: /Synthetic relationship 100/ })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  release();
  await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Synthetic relationship');
});

for (const role of ['customer_member', 'vendor_admin', 'fleet_manager', 'driver']) {
  test(`${role} does not mount the CRM reader`, async ({ page }) => {
    const { requests, upstream } = await harness(page, { role });
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Module filter' })).toHaveCount(0);
    expect(requests.some(url => url.pathname.startsWith('/api/crm/'))).toBe(false);
    expect(upstream.every(url => url.hostname === 'xano.example')).toBe(true);
  });
}
