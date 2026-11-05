import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { authorizedPreviewOrigin, installProtectedPreviewRouting, requireAuthorizedPreviewOrigin } from '../sandbox-e2e/protected-preview-route';

const dummy = 'SYNTHETIC-LOCAL-ONLY-NOT-A-VERCEL-CREDENTIAL';
let source: Server, sink: Server, origin: string, sinkOrigin: string;
let sourceRequests: { path: string; headerMatched: boolean }[], sinkRequests: number;

async function listen(server: Server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Local server address missing');
  return `http://127.0.0.1:${address.port}`;
}

test.beforeEach(async () => {
  sourceRequests = []; sinkRequests = 0;
  sink = createServer((_req, res) => { sinkRequests++; res.end('FOREIGN'); });
  sinkOrigin = await listen(sink);
  source = createServer((req, res) => {
    const url = new URL(req.url!, origin);
    sourceRequests.push({ path: url.pathname, headerMatched: req.headers['x-vercel-protection-bypass'] === dummy });
    if (url.pathname === '/redirect') {
      res.writeHead(Number(url.searchParams.get('code')), { Location: url.searchParams.get('target')! }); res.end();
    } else if (url.pathname === '/broken') {
      req.socket.destroy();
    } else if (url.pathname === '/echo') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({
        body, method: req.method, origin: req.headers.origin, csrf: req.headers['x-csrf-token'],
        cookiePresent: req.headers.cookie?.includes('synthetic=local') ?? false,
        bypassMatched: req.headers['x-vercel-protection-bypass'] === dummy,
      })); });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Set-Cookie': 'synthetic=local; HttpOnly; SameSite=Strict; Path=/' });
      res.end('<!doctype html><title>Local security fixture</title><h1>Genuine local response</h1>');
    }
  });
  origin = await listen(source);
});

test.afterEach(async () => {
  await Promise.all([source, sink].map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
  })));
});

test('genuine same-origin response delivered without putting bypass into browser headers', async ({ context, page }) => {
  const blocked: string[] = [];
  await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: x => blocked.push(x) });
  const response = await page.goto(origin);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading')).toHaveText('Genuine local response');
  expect(sourceRequests[0].headerMatched).toBe(true);
  expect((await response!.request().allHeaders())['x-vercel-protection-bypass']).toBeUndefined();
  expect(blocked).toEqual([]); expect(sinkRequests).toBe(0);
});

for (const code of [301, 302, 303, 307, 308]) {
  for (const targetKind of ['foreign', 'relative']) {
    test(`blocks ${code} ${targetKind} redirect without a second request`, async ({ context, page }) => {
      const blocked: string[] = [];
      await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: x => blocked.push(x) });
      const target = targetKind === 'foreign' ? sinkOrigin + '/secret-sink' : '/redirect-chain';
      const failed = await page.goto(`${origin}/redirect?code=${code}&target=${encodeURIComponent(target)}`).then(() => false, () => true);
      expect(failed).toBe(true);
      expect(sourceRequests).toEqual([{ path: '/redirect', headerMatched: true }]);
      expect(sinkRequests).toBe(0);
      expect(blocked).toContain('FORBIDDEN_BROWSER_REDIRECT');
    });
  }
}

test('direct foreign-origin navigation never reaches the foreign server', async ({ context, page }) => {
  const blocked: string[] = [];
  await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: x => blocked.push(x) });
  await page.goto(sinkOrigin).catch(() => {});
  expect(sourceRequests).toEqual([]); expect(sinkRequests).toBe(0);
  expect(blocked).toContain('FORBIDDEN_BROWSER_EGRESS');
});

test('different hostname on the same port is not the authorized origin', async ({ context, page }) => {
  const blocked: string[] = [];
  await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: x => blocked.push(x) });
  await page.goto(origin.replace('127.0.0.1', 'localhost')).catch(() => {});
  expect(sourceRequests).toEqual([]); expect(sinkRequests).toBe(0);
  expect(blocked).toContain('FORBIDDEN_BROWSER_EGRESS');
});

test('foreign fetch after a successful page load is blocked before egress', async ({ context, page }) => {
  const blocked: string[] = [];
  await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: x => blocked.push(x) });
  await page.goto(origin);
  const denied = await page.evaluate(url => fetch(url).then(() => false, () => true), sinkOrigin);
  expect(denied).toBe(true); expect(sinkRequests).toBe(0);
  expect(blocked).toContain('FORBIDDEN_BROWSER_EGRESS');
});

test('real forwarding preserves POST, Origin, CSRF and cookies without echoing the bypass', async ({ context, page }) => {
  await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: () => {} });
  await page.goto(origin);
  const response = await page.evaluate(async () => {
    const result = await fetch('/echo', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'SYNTHETIC-CSRF', 'x-vercel-protection-bypass': 'caller-value' }, body: '{"synthetic":true}' });
    return result.json();
  });
  expect(response).toEqual({ body: '{"synthetic":true}', method: 'POST', origin,
    csrf: 'SYNTHETIC-CSRF', cookiePresent: true, bypassMatched: true });
  expect(JSON.stringify(response)).not.toContain(dummy); expect(sinkRequests).toBe(0);
});

test('upstream network failures produce sanitized diagnostics', async ({ context, page }) => {
  const blocked: string[] = [];
  await installProtectedPreviewRouting(context, { origin, automation: dummy, loopbackTest: true, onBlocked: x => blocked.push(x) });
  await page.goto(origin + '/broken').catch(() => {});
  expect(blocked).toEqual(['PROTECTED_REQUEST_FAILED']);
  expect(JSON.stringify(blocked)).not.toContain(dummy); expect(sinkRequests).toBe(0);
});

test('remote harness accepts only the exact authorized preview origin', () => {
  expect(requireAuthorizedPreviewOrigin(authorizedPreviewOrigin)).toBe(authorizedPreviewOrigin);
  for (const invalid of [undefined, origin, authorizedPreviewOrigin + '/', authorizedPreviewOrigin + '.evil.invalid',
    authorizedPreviewOrigin.replace('https:', 'http:'), 'https://other-preview.vercel.app']) {
    expect(() => requireAuthorizedPreviewOrigin(invalid)).toThrow('exact authorized preview origin');
  }
});