import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { navs } from '../src/demo/data';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

for (const role of ['customer', 'owner', 'admin'] as const) {
  test(`${role}: responsive navigation, role palette and screenshots`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/?demo=1&preview=${role}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const colors = { customer: ['rgb(251, 246, 238)', 'rgb(205, 81, 40)'], owner: ['rgb(237, 244, 252)', 'rgb(37, 99, 184)'], admin: ['rgb(243, 239, 250)', 'rgb(121, 80, 174)'] };
    await expect(page.locator('.app-content')).toHaveCSS('background-color', colors[role][0]);
    // This is a generated Tailwind utility backed by the role theme, not a stylesheet text search.
    await expect(page.locator('.bg-brand-soft').first()).toHaveCSS('background-color', role === 'customer' ? 'rgb(251, 236, 224)' : role === 'admin' ? 'rgb(238, 228, 247)' : 'rgb(226, 237, 252)');
    expect(await page.locator('.app-content').evaluate(el => getComputedStyle(el).getPropertyValue('--z-brand').trim())).toBe(role === 'customer' ? '#cd5128' : role === 'admin' ? '#7950ae' : '#2563b8');
    await expect(page.locator('.text-brand').first()).toHaveCSS('color', role === 'customer' ? 'rgb(165, 61, 27)' : colors[role][1]);
    await mkdir('docs/screenshots', { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${role}-desktop.png`, fullPage: true });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await noOverflow(page);
      if (width === 390) await page.screenshot({ path: `docs/screenshots/${role}-mobile.png`, fullPage: true });
    }
    // Exercise every visible destination at the narrowest supported width.
    await page.setViewportSize({ width: 320, height: 844 });
    for (const destination of navs[role]) {
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await page.getByRole('dialog', { name: 'Navigation drawer' }).getByRole('navigation').getByRole('button', { name: destination, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await noOverflow(page);
    }
    expect(errors).toEqual([]);
  });
}

test('booking preserves inputs, validates contacts and saves only a draft', async ({ page }) => {
  await page.goto('/?demo=1&preview=customer#Book');
  await page.getByLabel('Pickup city', { exact: true }).fill('Chennai');
  await page.getByLabel('Delivery city', { exact: true }).fill('Bengaluru');
  await page.getByLabel('Exact pickup address').fill('Gate 3, Chennai Port, 600001');
  await page.getByLabel('Exact delivery address').fill('Bay 2, Bengaluru, 560001');
  await page.getByLabel('Sender contact').fill('123');
  await page.getByLabel('Receiver contact').fill('9876543210');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('10–15 digits');
  await page.getByLabel('Sender contact').fill('9876543210');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Cargo description').fill('Textile rolls');
  await page.getByLabel('Weight (tonnes)').fill('3.5');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Exact pickup address')).toHaveValue('Gate 3, Chennai Port, 600001');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Cargo description')).toHaveValue('Textile rolls');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Designated payer').fill('Gopi Industries');
  await page.getByLabel('Requested payment arrangement').selectOption('ToPay');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('ToPay', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save preview draft' }).click();
  await page.getByRole('button', { name: 'View order DRAFT-1', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Not initiated');
  await expect(page.getByRole('dialog')).toContainText('Awaiting quote');
  await expect(page.getByRole('dialog')).toContainText('Not assigned');
});

test('owner offline preserves active work and POD never claims upload or verification', async ({ page }) => {
  await page.goto('/?demo=1&preview=owner');
  await page.getByRole('button', { name: 'Available for new work' }).click();
  await expect(page.getByRole('button', { name: 'Available for new work' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('navigation').getByRole('button', { name: 'Jobs', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ZP-2048', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ZP-2045', exact: true })).toHaveCount(0);
  await expect(page.getByText('In transit', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await page.getByRole('button', { name: 'Prepare POD' }).first().click();
  await page.getByLabel('POD file · image or PDF').setInputFiles({ name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
  await expect(page.getByRole('alert')).toContainText('Choose a JPG');
  await page.getByLabel('POD file · image or PDF').setInputFiles({ name: 'receipt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await expect(page.getByRole('status')).toContainText('not uploaded or verified');
  await expect(page.getByRole('button', { name: 'Upload service unavailable' })).toBeDisabled();
});

test('search empty state, keyboard dialog and mobile Tamil layouts', async ({ page }) => {
  await page.goto('/?demo=1&preview=customer#Orders');
  await page.getByRole('textbox', { name: 'Search orders' }).fill('does-not-exist');
  await expect(page.getByRole('heading', { name: 'No orders found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'View order ZP-2048' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View order ZP-2048' })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByLabel('Navigation language').selectOption('ta');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Book', exact: true })).toContainText('பதிவு');
  await noOverflow(page);
  await page.screenshot({ path: 'docs/screenshots/customer-tamil-navigation.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const role of ['customer', 'owner', 'admin'] as const) {
  test(`${role}: accessibility on dashboard and key workflow`, async ({ page }) => {
    await page.goto(`/?demo=1&preview=${role}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const scan = async () => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    };
    await scan();
    const workflow = role === 'customer' ? 'Book' : role === 'owner' ? 'Jobs' : 'Reviews & Holds';
    await page.getByRole('navigation').getByRole('button', { name: workflow, exact: true }).click();
    await scan();
  });
}

test('production refuses role self-assignment and excludes fixtures from all JS bundles', async ({ page }) => {
  const assets = await readdir('dist/assets');
  const scripts = await Promise.all(assets.filter(f => f.endsWith('.js')).map(f => readFile(`dist/assets/${f}`, 'utf8')));
  const bundle = scripts.join('\n');
  for (const forbidden of ['ZP-2048', 'Gopi Industries', 'Preview workspace', 'setRole', 'initialOrders', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'CRM_READ_GRANTS_JSON']) expect(bundle).not.toContain(forbidden);
  for (const suffix of ['?demo=1&preview=admin#All%20Orders', '?demo=1&preview=owner#Earnings', 'admin/crm']) {
    await page.goto(`http://127.0.0.1:4173/${suffix}`);
    await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Preview workspace' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign in unavailable' })).toBeDisabled();
  }
  await page.screenshot({ path: 'docs/screenshots/production-access-gate.png', fullPage: true });
});

test('salaried driver has assigned scope and no financial data or management actions', async ({ page }) => {
  await page.goto('/?demo=1&preview=owner&scenario=salaried');
  await expect(page.getByRole('combobox', { name: 'Preview workspace' }).locator('option')).toHaveCount(3);
  await expect(page.locator('main')).not.toContainText('₹');
  await page.getByRole('button', { name: 'View order ZP-2048' }).click();
  await expect(page.getByRole('dialog')).not.toContainText('18,500');
  await expect(page.getByRole('dialog')).not.toContainText('Remaining balance');
  await page.keyboard.press('Escape');
  await page.getByRole('navigation').getByRole('button', { name: 'Vehicles', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'TN 01 AB 2048' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('TN 30 CK 6124');
  await expect(page.getByRole('button', { name: 'Draft vehicle record' })).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: 'Earnings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Financial permission required' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/screenshots/owner-salaried-restriction.png', fullPage: true });
});

test('fleet owner can prepare corrected evidence on scoped holds, but cannot execute trips', async ({ page }) => {
  await page.goto('/?demo=1&preview=owner&scenario=fleetOwner#Jobs');
  await expect(page.getByLabel('Trip update', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await expect(page.getByText('Correction requested', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare re-upload' }).click();
  await expect(page.getByRole('dialog')).toContainText('Correction requested');
  await page.getByLabel('POD file · image or PDF').setInputFiles({ name: 'corrected.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await expect(page.getByRole('status')).toContainText('not uploaded or verified');
  await expect(page.getByRole('button', { name: 'Upload service unavailable' })).toBeDisabled();
});

test('offer response never assigns a trip and offline blocks new acceptance', async ({ page }) => {
  await page.goto('/?demo=1&preview=owner#Jobs');
  await page.getByRole('button', { name: 'Offers', exact: true }).click();
  await page.getByRole('button', { name: 'Available for new work' }).click();
  await expect(page.getByRole('button', { name: 'Preview accept' })).toBeDisabled();
  await page.getByRole('button', { name: 'Available for new work' }).click();
  await page.getByRole('button', { name: 'Preview accept' }).click();
  await expect(page.getByText('Local acceptance draft · assignment pending')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preview decline' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Assigned', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View order ZP-2048' })).toBeVisible();
});

test('consent, timeout, POD and collections remain separate; cancellation is not executed', async ({ page }) => {
  await page.goto('/?demo=1&preview=customer#Payments');
  await page.getByRole('button', { name: 'View breakdown' }).nth(3).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Unknown — reconcile');
  await expect(dialog).toContainText('ToPay consent accepted');
  await expect(dialog).toContainText('Correction requested');
  const collection = dialog.locator('dl > div').filter({ has: page.getByText('Verified collection · sample', { exact: true }) });
  await expect(collection).toContainText('₹0');
  await dialog.getByText('Cancellation eligibility', { exact: true }).click();
  await dialog.getByLabel('Reason for cancellation request').fill('Customer request for review');
  await dialog.getByRole('button', { name: 'Prepare request draft' }).click();
  await expect(dialog.getByRole('status')).toContainText('has not been cancelled');
  await expect(dialog.getByRole('button', { name: 'Submit cancellation unavailable' })).toBeDisabled();
});

test('demo is explicit; CRM preview never makes live reads; direct anonymous API denied', async ({ page, request }) => {
  await page.goto('/?preview=admin');
  await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
  const calls: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/crm')) calls.push(r.url()); });
  await page.goto('/?demo=1&preview=admin#CRM');
  await expect(page.getByText('Last recorded probe: HTTP 401.')).toBeVisible();
  expect(calls).toEqual([]);
  const response = await request.get('/api/crm/records?module=Contacts&id=1');
  expect(response.status()).toBe(401);
  await page.screenshot({ path: 'docs/screenshots/admin-crm-unavailable.png', fullPage: true });
});

test('authenticated CRM contract UI supports module filter, page search, details and pagination', async ({ page }) => {
  // Browser contract mocks only: no requests reach Xano or Zoho.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let json: object;
    if (url.pathname === '/api/status') json = { authenticationConfigured: true };
    else if (url.pathname === '/api/auth/login') json = { authToken: 'test-token-only' };
    else if (url.pathname === '/api/auth/me') json = { user: { id: 7, name: 'Contract test', role: 'admin', email: 'test@example.com' } };
    else if (url.pathname === '/api/crm/modules') json = { modules: [{ apiName: 'Contacts', label: 'Authorized people', readOnly: true }] };
    else if (url.pathname === '/api/crm/records') json = { records: [{ id: url.searchParams.get('page') === '2' ? '101' : '100', fields: { Last_Name: url.searchParams.get('page') === '2' ? 'Second record' : 'First record' }, orderLinks: [] }], nextPage: url.searchParams.get('page') === '2' ? null : 2 };
    else if (url.pathname === '/api/crm/record') json = { record: { id: '100', fields: { Last_Name: 'First record', Email: 'test@example.com' }, orderLinks: [] } };
    else throw new Error('Unexpected API route');
    await route.fulfill({ json });
  });
  await page.goto('http://127.0.0.1:4173/admin/crm');
  await page.getByLabel('Email', { exact: true }).fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Password123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Module filter').selectOption('Contacts');
  await page.getByLabel('Search this authorized page').fill('absent');
  await expect(page.getByRole('heading', { name: 'No matching records on this page' })).toBeVisible();
  await page.getByLabel('Search this authorized page').fill('First');
  await page.getByRole('button', { name: /First record/ }).click();
  await expect(page.getByRole('dialog')).toContainText('test@example.com');
  await expect(page.getByRole('dialog')).toContainText('Related Zippy orders: unavailable');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('button', { name: /Second record/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A secure start to every journey.' })).toBeVisible();
});
