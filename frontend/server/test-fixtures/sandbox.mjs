// Mocked test doubles only. Never used by the deployed gateway.
import assert from 'node:assert/strict';
import { createSandboxGateway, SESSION_COOKIE, CSRF_COOKIE } from '../sandbox-gateway.mjs';
import { sandboxBranch, sandboxTarget } from '../sandbox-target.mjs';
export const registration = { name: 'SYNTHETIC Customer', organization_name: 'SYNTHETIC Organization', email: 'mock-a@example.invalid', password: 'MockOnlyPassword123!' };
export const draft = { request_id: '9864075b-4614-4cf9-a018-0f5cde2a8821', pickup_city: 'Synthetic Origin', pickup_street: 'Synthetic Street A', delivery_city: 'Synthetic Destination', delivery_street: 'Synthetic Street B', pickup_window_start: 1999000000000, pickup_window_end: 1999003600000, delivery_window_start: 1999086400000, delivery_window_end: 1999090000000 };
export function harness(overrides = {}) {
  let time = Date.parse('2026-11-03T08:00:00Z');
  const env = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: sandboxBranch, ZIPPY_SANDBOX_GATEWAY_RELEASE: 'synthetic-only', ZIPPY_SANDBOX_WEB_ORIGIN: 'https://test-preview.vercel.app', ZIPPY_SANDBOX_SESSION_KEY: Buffer.alloc(32, 7).toString('base64'), ...overrides };
  const state = new Map(), counters = new Map(), users = [], bookings = [], replay = new Map(), calls = [];
  const store = {
    async create(id, value) { state.set(id, structuredClone(value)); },
    async get(id) { return state.get(id) || null; },
    async delete(id) { state.delete(id); },
    async consume(key, limit, seconds) { const item = counters.get(key); const next = item && item.until > time ? { ...item, count: item.count + 1 } : { count: 1, until: time + seconds * 1000 }; counters.set(key, next); return next.count <= limit; },
  };
  const flags = { revoked: false, extraField: false, foreignProjection: false, invalidLogin: false, failure: false };
  const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  async function fetchImpl(url, options) {
    const parsed = new URL(url); assert.equal(parsed.origin, sandboxTarget.origin); assert.ok(parsed.pathname.startsWith('/tenant/' + sandboxTarget.tenant + '/api:')); assert.equal(options.redirect, 'error');
    calls.push({ path: parsed.pathname, method: options.method });
    if (flags.failure) throw Error('PRIVATE_UPSTREAM_ERROR_DO_NOT_EXPOSE');
    const path = parsed.pathname.split('/api:')[1].split('/').slice(1).join('/'), input = options.body ? JSON.parse(options.body) : undefined;
    if (path === 'auth/register') { const id = users.length + 1; users.push({ ...input, id }); return response({ user_id: id, organization_id: id, approval_request_id: id, system_role: 'customer_admin', status: 'active', booking_scope: 'draft_only', verification_state: 'pending_human_review' }); }
    if (path === 'auth/login') { const user = users.find(u => u.email === input.email && u.password === input.password); return user && !flags.invalidLogin ? response({ authToken: 'mock-xano-token-' + user.id, user_id: user.id }) : response({ code: 'INVALID', message: 'PRIVATE_UPSTREAM_ERROR_DO_NOT_EXPOSE' }, 401); }
    const id = Number(options.headers.Authorization?.split('-').at(-1)), user = users.find(u => u.id === id);
    if (!user) return response({ code: 'DENIED' }, 401);
    if (flags.revoked) return response({ code: 'DENIED' }, 403);
    if (path === 'auth/me') return response({ id, name: user.name, email: user.email, system_role: 'customer_admin', status: 'active', active_organization_id: id, ...(flags.extraField ? { private_storage_key: 'sensitive-mock' } : {}) });
    if (path === 'organization/membership') return response({ organization: { id, name: user.organization_name, type: 'customer', status: 'active', kyb_verified: false }, membership: { id, organization_id: id, user_id: id, member_role: 'owner', is_primary: true, is_active: true }, booking_scope: 'draft_only' });
    if (path === 'bookings' && options.method === 'POST') {
      const key = id + ':' + input.request_id;
      if (replay.has(key)) return JSON.stringify(replay.get(key).input) === JSON.stringify(input) ? response(replay.get(key).data) : response({ code: 'CONFLICT' }, 400);
      const booking = { id: bookings.length + 1, booking_reference: 'DRAFT-MOCK-' + (bookings.length + 1), customer_organization_id: id, status: 'draft', payment_status: 'pending', payment_mode: 'prepaid', pickup_city: input.pickup_city, delivery_city: input.delivery_city, version: 1 };
      bookings.push(booking); const data = { booking, draft_only: true, execution_enabled: false }; replay.set(key, { input, data }); return response(data);
    }
    if (path === 'bookings') return response({ items: flags.foreignProjection ? [{ ...bookings[0], customer_organization_id: id + 1 }] : bookings.filter(b => b.customer_organization_id === id), curPage: 1, nextPage: null });
    const booking = bookings.find(b => b.id === Number(path.split('/')[1]) && b.customer_organization_id === id);
    return booking ? response({ booking, cargo: [], active_holds: [], blocking_reasons: ['Operations unavailable'], allowed_actions: [] }) : response({ code: 'NOT_FOUND' }, 404);
  }
  const gateway = () => createSandboxGateway({ env, fetchImpl, store, now: () => time });
  function browser(handle = gateway(), ip = 'synthetic-test-ip') {
    const cookies = new Map(); let csrf = '';
    return {
      cookies,
      async call(route, body, extra = {}) {
        const headers = new Headers({ Origin: env.ZIPPY_SANDBOX_WEB_ORIGIN, 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json', Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), 'X-CSRF-Token': csrf, ...extra.headers });
        const result = await handle({ url: '/api/sandbox/' + route, method: body === undefined ? 'GET' : 'POST', body, headers, clientIp: ip, ...extra, ...(extra.headers ? { headers } : {}) });
        for (const c of result.cookies || []) { const [name, value] = c.split(';')[0].split('='); if (value) cookies.set(name, value); else cookies.delete(name); }
        if (result.data.csrf) csrf = result.data.csrf;
        return result;
      },
      async signIn(input = registration) { await this.call('csrf'); assert.equal((await this.call('auth/register', input)).status, 201); const result = await this.call('auth/login', { email: input.email, password: input.password }); assert.equal(result.status, 200); return result; },
    };
  }
  return { env, store, state, counters, calls, flags, users, bookings, browser, gateway, advance: ms => { time += ms; }, now: () => time, SESSION_COOKIE, CSRF_COOKIE };
}
