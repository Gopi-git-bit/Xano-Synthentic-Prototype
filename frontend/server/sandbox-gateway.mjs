import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createSandboxCustomerClient } from './sandbox-customer-flow.mjs';
import { createSandboxStore } from './sandbox-store.mjs';
import { sandboxBranch, sandboxTarget } from './sandbox-target.mjs';

// Vercel Marketplace Upstash exposes branch-scoped KV_REST_API_* secrets at runtime.
// Prefer an explicitly configured pair, never mix half-configured credential pairs.
export function sandboxRedisCredentials(env) {
  const explicit = Boolean(env.ZIPPY_SANDBOX_REDIS_URL || env.ZIPPY_SANDBOX_REDIS_TOKEN);
  return explicit
    ? { url: env.ZIPPY_SANDBOX_REDIS_URL, token: env.ZIPPY_SANDBOX_REDIS_TOKEN }
    : { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
}

export const SESSION_COOKIE = '__Host-zippy-sandbox';
export const CSRF_COOKIE = '__Host-zippy-sandbox-csrf';
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const validId = v => Number.isSafeInteger(v) && v > 0;
const opaque = v => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);
class SandboxError extends Error {
  constructor(status, code, message) { super(message); Object.assign(this, { status, code }); }
}
const fail = (status, code, message) => { throw new SandboxError(status, code, message); };
const contract = condition => { if (!condition) fail(502, 'SANDBOX_CONTRACT', 'Sandbox response could not be verified.'); };
const exact = (value, fields) => object(value) && Object.keys(value).length === fields.length && fields.every(k => Object.hasOwn(value, k));
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cookie = (name, value, seconds) => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;
const clearCookies = () => [cookie(SESSION_COOKIE, '', 0), cookie(CSRF_COOKIE, '', 0)];

function readCookie(headers, name) {
  const entries = (headers.get('cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith(name + '='));
  if (entries.length > 1) fail(400, 'INVALID_COOKIE', 'Session cookies are ambiguous.');
  return entries[0]?.slice(name.length + 1);
}
function booking(row, organizationId) {
  contract(exact(row, ['id', 'booking_reference', 'customer_organization_id', 'status', 'payment_status', 'payment_mode', 'pickup_city', 'delivery_city', 'version'])
    && validId(row.id) && row.customer_organization_id === organizationId && row.status === 'draft'
    && row.payment_status === 'pending' && row.payment_mode === 'prepaid' && row.version === 1
    && ['booking_reference', 'pickup_city', 'delivery_city'].every(k => typeof row[k] === 'string' && row[k].length > 0 && row[k].length <= 500));
  return { id: row.id, reference: row.booking_reference, pickupCity: row.pickup_city, deliveryCity: row.delivery_city, version: row.version, status: 'draft' };
}

export function createSandboxGateway({ env = process.env, fetchImpl = fetch, store: suppliedStore, now = Date.now } = {}) {
  let sharedStore;
  function configuration() {
    if (env.VERCEL_ENV !== 'preview' || env.VERCEL_GIT_COMMIT_REF !== sandboxBranch
      || env.ZIPPY_SANDBOX_GATEWAY_RELEASE !== 'synthetic-only' || now() >= sandboxTarget.expiresAt)
      fail(503, 'SANDBOX_DISABLED', 'Verified sandbox preview is unavailable or expired.');
    let origin, key;
    try {
      origin = new URL(env.ZIPPY_SANDBOX_WEB_ORIGIN);
      key = Buffer.from(env.ZIPPY_SANDBOX_SESSION_KEY || '', 'base64');
    } catch { fail(503, 'SANDBOX_NOT_CONFIGURED', 'Protected sandbox configuration is incomplete.'); }
    if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.vercel.app') || origin.port || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password || key.length !== 32)
      fail(503, 'SANDBOX_NOT_CONFIGURED', 'Protected sandbox configuration is incomplete.');
    const ttl = Number(env.ZIPPY_SANDBOX_SESSION_TTL_SECONDS || 900);
    if (!Number.isInteger(ttl) || ttl < 60 || ttl > 1800) fail(503, 'SANDBOX_NOT_CONFIGURED', 'Session lifetime configuration is invalid.');
    if (!sharedStore) sharedStore = suppliedStore || createSandboxStore({ ...sandboxRedisCredentials(env), key, namespace: sandboxTarget.tenant, fetchImpl });
    return { origin: origin.origin, key, ttl, store: sharedStore };
  }
  const client = createSandboxCustomerClient({ expectedOrigin: sandboxTarget.origin, expectedTenant: sandboxTarget.tenant,
    authBase: `${sandboxTarget.origin}/tenant/${sandboxTarget.tenant}/api:${sandboxTarget.authGroup}`,
    bookingsBase: `${sandboxTarget.origin}/tenant/${sandboxTarget.tenant}/api:${sandboxTarget.bookingsGroup}`, fetchImpl });
  async function upstream(fn) {
    try { return await fn(); } catch (error) {
      const status = Number(/SANDBOX_CONTRACT: Sandbox HTTP (\d{3})$/.exec(error?.message)?.[1]);
      if ([401, 403].includes(status)) fail(status, 'SESSION_DENIED', 'Credentials or current organization permissions are invalid.');
      if (status === 404) fail(404, 'BOOKING_UNAVAILABLE', 'Booking not found.');
      if (status === 400) fail(400, 'INVALID_REQUEST', 'Sandbox request was rejected. Check your input; retry with the same request ID if the outcome is uncertain.');
      if (status === 429) fail(429, 'RATE_LIMITED', 'Too many requests. Try again later.');
      fail(502, 'SANDBOX_UNAVAILABLE', 'Sandbox request could not be verified. No successful outcome is confirmed.');
    }
  }
  async function context(token, expected) {
    const identity = await upstream(() => client.identity(token));
    const membership = await upstream(() => client.membership(token));
    contract(exact(identity, ['id', 'name', 'email', 'system_role', 'status', 'active_organization_id'])
      && exact(membership, ['organization', 'membership', 'booking_scope'])
      && exact(membership.organization, ['id', 'name', 'type', 'status', 'kyb_verified'])
      && exact(membership.membership, ['id', 'organization_id', 'user_id', 'member_role', 'is_primary', 'is_active']));
    const org = membership.organization, member = membership.membership;
    contract(org.id === identity.active_organization_id && member.organization_id === org.id && member.user_id === identity.id
      && validId(member.id) && org.type === 'customer' && org.status === 'active' && org.kyb_verified === false
      && member.is_active === true && member.is_primary === true && member.member_role === 'owner' && membership.booking_scope === 'draft_only'
      && identity.name.startsWith('SYNTHETIC ') && identity.email.endsWith('@example.invalid') && typeof org.name === 'string' && org.name.startsWith('SYNTHETIC '));
    if (expected && (identity.id !== expected.userId || org.id !== expected.organizationId)) fail(403, 'SESSION_DENIED', 'Session organization changed. Sign in again.');
    return { user: { id: identity.id, name: identity.name, email: identity.email }, organization: { id: org.id, name: org.name, verification: 'pending_human_review' }, membership: { role: 'owner', active: true }, bookingScope: 'draft_only' };
  }
  function csrf(config) {
    const value = randomBytes(32).toString('base64url'), expiry = Math.min(now() + 1800000, sandboxTarget.expiresAt);
    const payload = `${value}.${expiry}`;
    const mac = createHmac('sha256', config.key).update(config.origin + ':' + payload).digest('base64url');
    return { value, cookie: cookie(CSRF_COOKIE, payload + '.' + mac, Math.floor((expiry - now()) / 1000)) };
  }
  function verifyCsrf(headers, config) {
    const value = readCookie(headers, CSRF_COOKIE), parts = value?.split('.') || [];
    if (parts.length !== 3 || !opaque(parts[0]) || !/^\d{13}$/.test(parts[1]) || Number(parts[1]) <= now()
      || Number(parts[1]) > Math.min(now() + 1800000, sandboxTarget.expiresAt)
      || !same(parts[0], headers.get('x-csrf-token'))
      || !same(parts[2], createHmac('sha256', config.key).update(config.origin + ':' + parts.slice(0, 2).join('.')).digest('base64url')))
      fail(403, 'CSRF_DENIED', 'Refresh this page before submitting.');
  }
  return async function handle({ method = 'GET', url, headers = new Headers(), body, clientIp = 'unknown' }) {
    let activeId, config;
    try {
      config = configuration();
      const parsed = new URL(url, config.origin);
      const route = parsed.pathname === '/api/sandbox' ? parsed.searchParams.get('path') : parsed.pathname.replace(/^\/api\/sandbox\//, '');
      if ([...parsed.searchParams.keys()].some(k => k !== 'path') || parsed.searchParams.getAll('path').length > 1
        || (parsed.pathname !== '/api/sandbox' && parsed.searchParams.has('path'))) fail(400, 'INVALID_QUERY', 'Caller-selected scope and queries are not allowed.');
      const allowed = { csrf: 'GET', 'auth/register': 'POST', 'auth/login': 'POST', 'auth/logout': 'POST', 'auth/me': 'GET', 'organization/membership': 'GET', bookings: ['GET', 'POST'] };
      const detail = /^bookings\/[1-9]\d{0,14}$/.test(route || '');
      if (!Object.hasOwn(allowed, route || '') && !detail) fail(404, 'ENDPOINT_DISABLED', 'This sandbox operation is unavailable.');
      if (!(Array.isArray(allowed[route]) ? allowed[route] : [detail ? 'GET' : allowed[route]]).includes(method)) fail(405, 'METHOD_NOT_ALLOWED', 'Method is not allowed.');
      if (headers.has('authorization')) fail(400, 'BROWSER_BEARER_DENIED', 'Use the protected sandbox session.');
      if (headers.get('sec-fetch-site') && headers.get('sec-fetch-site') !== 'same-origin') fail(403, 'ORIGIN_DENIED', 'Same-origin requests are required.');
      if (headers.has('origin') && headers.get('origin') !== config.origin) fail(403, 'ORIGIN_DENIED', 'Same-origin requests are required.');
      if (!await config.store.consume('ip:' + clientIp, 120, 60)) fail(429, 'RATE_LIMITED', 'Too many requests. Try again later.');
      if (method === 'POST') {
        if (headers.get('origin') !== config.origin) fail(403, 'ORIGIN_DENIED', 'Same-origin requests are required.');
        if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(headers.get('content-type') || '')) fail(415, 'JSON_REQUIRED', 'JSON is required.');
        if (!object(body) || Buffer.byteLength(JSON.stringify(body)) > 8192) fail(400, 'INVALID_INPUT', 'Invalid request body.');
        verifyCsrf(headers, config);
      }
      if (route === 'csrf') {
        const challenge = csrf(config);
        return { status: 200, data: { csrf: challenge.value, mode: 'isolated_xano_gateway', version: '0.3.0-sandbox-browser', backendVersion: '0.2.0-sandbox-customer', frontendCommit: env.VERCEL_GIT_COMMIT_SHA || 'unreported' }, cookies: [challenge.cookie] };
      }
      if (route === 'auth/register' || route === 'auth/login') {
        const register = route === 'auth/register';
        if (!exact(body, register ? ['name', 'organization_name', 'email', 'password'] : ['email', 'password'])
          || typeof body.email !== 'string' || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,220}@example\.invalid$/i.test(body.email)
          || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256
          || register && ['name', 'organization_name'].some(k => typeof body[k] !== 'string' || !/^SYNTHETIC \S/.test(body[k]) || body[k].length > 100))
          fail(400, 'SYNTHETIC_INPUT_REQUIRED', 'Use SYNTHETIC names, an @example.invalid email and a test password of 12–256 characters.');
        if (!await config.store.consume((register ? 'register:' : 'login:') + clientIp, register ? 3 : 10, register ? 3600 : 300)
          || !await config.store.consume('account:' + body.email.toLowerCase(), 5, 300)) fail(429, 'RATE_LIMITED', 'Too many account attempts. Try again later.');
        if (register) {
          const result = await upstream(() => client.register(body));
          return { status: 201, data: { ...result, verification: 'pending_human_review', bookingScope: 'draft_only' } };
        }
        const result = await upstream(() => client.login(body.email, body.password));
        const current = await context(result.token);
        contract(result.userId === current.user.id);
        const oldId = readCookie(headers, SESSION_COOKIE);
        if (opaque(oldId)) await config.store.delete(oldId);
        const id = randomBytes(32).toString('base64url');
        const ttl = Math.min(config.ttl, Math.floor((sandboxTarget.expiresAt - now()) / 1000));
        if (ttl <= 0) fail(503, 'SANDBOX_EXPIRED', 'The sandbox has expired.');
        const expiresAt = now() + ttl * 1000;
        await config.store.create(id, { token: result.token, userId: current.user.id, organizationId: current.organization.id, expiresAt }, ttl);
        const challenge = csrf(config);
        return { status: 200, data: { ...current, csrf: challenge.value, expiresAt }, cookies: [cookie(SESSION_COOKIE, id, ttl), challenge.cookie] };
      }
      activeId = readCookie(headers, SESSION_COOKIE);
      if (route === 'auth/logout') {
        if (!exact(body, [])) fail(400, 'INVALID_INPUT', 'Logout requires an empty body.');
        if (opaque(activeId)) await config.store.delete(activeId);
        return { status: 200, data: { loggedOut: true }, cookies: clearCookies() };
      }
      if (!opaque(activeId)) fail(401, 'SESSION_REQUIRED', 'Session expired or unavailable. Sign in again.');
      const session = await config.store.get(activeId);
      if (!object(session) || !Number.isFinite(session.expiresAt) || session.expiresAt <= now()) {
        await config.store.delete(activeId); fail(401, 'SESSION_EXPIRED', 'Session expired. Sign in again.');
      }
      contract(typeof session.token === 'string' && validId(session.userId) && validId(session.organizationId));
      const current = await context(session.token, session);
      if (route === 'auth/me' || route === 'organization/membership') return { status: 200, data: { ...current, expiresAt: session.expiresAt } };
      if (route === 'bookings' && method === 'POST') {
        const fields = ['request_id', 'pickup_city', 'pickup_street', 'delivery_city', 'delivery_street', 'pickup_window_start', 'pickup_window_end', 'delivery_window_start', 'delivery_window_end'];
        if (!exact(body, fields) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.request_id)
          || fields.slice(1, 5).some(k => typeof body[k] !== 'string' || body[k].trim().length < 2 || body[k].length > 200)
          || fields.slice(5).some(k => !Number.isSafeInteger(body[k]) || body[k] <= 0)
          || !(body.pickup_window_start < body.pickup_window_end && body.pickup_window_end <= body.delivery_window_start && body.delivery_window_start < body.delivery_window_end))
          fail(400, 'INVALID_DRAFT', 'Provide a request ID, bounded route fields and ordered time windows.');
        const data = await upstream(() => client.createDraft(session.token, body));
        contract(exact(data, ['booking', 'draft_only', 'execution_enabled']));
        return { status: 200, data: { booking: booking(data.booking, current.organization.id), draftOnly: true, executionEnabled: false } };
      }
      if (route === 'bookings') {
        const data = await upstream(() => client.listDrafts(session.token));
        contract(exact(data, ['items', 'curPage', 'nextPage']) && data.items.length <= 100 && (data.nextPage === null || data.nextPage === 2));
        return { status: 200, data: { items: data.items.map(row => booking(row, current.organization.id)), nextPage: data.nextPage } };
      }
      const id = Number(route.split('/')[1]);
      const data = await upstream(() => client.detail(session.token, id));
      contract(exact(data, ['booking', 'cargo', 'active_holds', 'blocking_reasons', 'allowed_actions']) && data.allowed_actions.length === 0
        && data.cargo.length === 0 && data.active_holds.length === 0 && Array.isArray(data.blocking_reasons) && data.blocking_reasons.length === 1);
      return { status: 200, data: { booking: booking(data.booking, current.organization.id), allowedActions: [] } };
    } catch (error) {
      const safe = error instanceof SandboxError ? error : new SandboxError(503, 'SANDBOX_UNAVAILABLE', 'Protected sandbox state is unavailable. Try again later.');
      if ([401, 403].includes(safe.status) && opaque(activeId) && config) {
        try { await config.store.delete(activeId); } catch { return { status: 503, data: { error: { code: 'SESSION_STORE_UNAVAILABLE', message: 'Session revocation could not be confirmed. Try again.' } } }; }
      }
      return { status: safe.status, data: { error: { code: safe.code, message: safe.message } }, ...([401, 403].includes(safe.status) && activeId ? { cookies: clearCookies() } : {}), ...(safe.status === 429 ? { retryAfter: 300 } : {}) };
    }
  };
}
