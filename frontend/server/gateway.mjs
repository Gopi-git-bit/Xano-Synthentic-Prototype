// Server-only adapter. Never import this directory from src/.
import { bookingDetail, bookingPage, bookingStatuses } from './bookings.mjs';
export class ServiceError extends Error {
  constructor(status, code, message, retryAfter) { super(message); Object.assign(this, { status, code, retryAfter }); }
}
const fail = (status, code, message) => { throw new ServiceError(status, code, message); };
const namePattern = /^[A-Za-z][A-Za-z0-9_]{0,99}$/;
const recordPattern = /^\d{1,30}$/;
const domains = ['com', 'in', 'eu', 'com.au', 'jp', 'com.cn', 'sa'];
const accountsHosts = new Set([...domains.map(d => `accounts.zoho.${d}`), 'accounts.zohocloud.ca']);
const apiHosts = new Set([...domains.map(d => `www.zohoapis.${d}`), 'www.zohoapis.ca']);

export function createGateway({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  let token;
  let refreshing;
  let rateLimitedUntil = 0;
  function handleRateLimit(response) {
    if (response.status !== 429) return;
    const delay = response.headers.get('retry-after');
    const seconds = /^\d+$/.test(delay || '') ? Number(delay) : Math.ceil((Date.parse(delay || '') - now()) / 1000);
    const retryAfter = Number.isFinite(seconds) ? Math.max(1, Math.min(3600, seconds)) : 60;
    rateLimitedUntil = now() + retryAfter * 1000;
    throw new ServiceError(429, 'RATE_LIMITED', 'Zoho is rate limited. Retry after the indicated delay.', retryAfter);
  }

  async function request(url, options = {}) {
    try {
      return await fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(12000) });
    } catch { fail(503, 'UPSTREAM_UNAVAILABLE', 'Service unavailable or timed out. No successful outcome is confirmed.'); }
  }
  async function json(response) {
    try { return await response.json(); } catch { fail(502, 'INVALID_RESPONSE', 'The service returned an unreadable response.'); }
  }
  function xanoUrl(path, key = 'XANO_AUTH_BASE_URL') {
    if (!env[key]) fail(503, 'XANO_NOT_CONFIGURED', 'Xano service is not configured.');
    let base;
    try { base = new URL(env[key]); } catch { fail(503, 'XANO_NOT_CONFIGURED', 'Xano configuration needs review.'); }
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) fail(503, 'XANO_NOT_CONFIGURED', 'Xano configuration needs review.');
    return `${base.href.replace(/\/$/, '')}/${path}`;
  }
  function configured(key) { try { xanoUrl('', key); return true; } catch { return false; } }
  function previewConnectionAvailable() {
    if (!env.XANO_PREVIEW_TENANT) return !env.XANO_PREVIEW_EXPIRES_AT;
    const expires = Date.parse(env.XANO_PREVIEW_EXPIRES_AT || '');
    return env.VERCEL_ENV === 'preview' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(env.XANO_PREVIEW_TENANT)
      && Number.isFinite(expires) && now() < expires;
  }
  const authAvailable = () => previewConnectionAvailable() && configured('XANO_AUTH_BASE_URL') && env.XANO_AUTH_RELEASE === 'verified';
  const bookingReadsAvailable = () => authAvailable() && configured('XANO_LOGISTICS_BASE_URL') && env.XANO_BOOKING_READS_RELEASE === 'verified';
  function requireAuthRelease() {
    if (!authAvailable()) fail(503, 'AUTH_RELEASE_PENDING', 'Account access is unavailable pending Xano authentication security and permission verification.');
  }
  async function xano(path, options, key) {
    requireAuthRelease();
    const headers = new Headers(options?.headers);
    if (env.XANO_PREVIEW_TENANT) headers.set('X-Tenant', env.XANO_PREVIEW_TENANT);
    const response = await request(xanoUrl(path, key), env.XANO_PREVIEW_TENANT ? { ...options, headers } : options);
    if (response.status === 401) fail(401, 'AUTH_REQUIRED', 'Sign in with a valid account.');
    if (response.status === 403) fail(403, 'ACCESS_DENIED', 'This account is not authorized for the request.');
    if (response.status === 404) fail(404, 'RECORD_UNAVAILABLE', 'The requested record is unavailable.');
    if (response.status === 429) throw new ServiceError(429, 'RATE_LIMITED', 'Too many requests. Try again later.', 60);
    if (!response.ok) fail(response.status < 500 ? 400 : 503, 'XANO_REQUEST_FAILED', 'Request could not be completed. No successful outcome is confirmed.');
    return json(response);
  }
  async function authenticate(headers) {
    const auth = headers.get('authorization') || '';
    if (!/^Bearer [^\s]{1,4096}$/.test(auth)) fail(401, 'AUTH_REQUIRED', 'Sign in to continue.');
    requireAuthRelease();
    const user = await xano('auth/me', { headers: { Authorization: auth } });
    const workspace = ['super_admin', 'operations_admin'].includes(user?.system_role) ? 'admin' : ['customer_admin', 'customer_member'].includes(user?.system_role) ? 'customer' : ['vendor_admin', 'fleet_manager', 'driver'].includes(user?.system_role) ? 'owner' : null;
    if (!Number.isSafeInteger(user?.id) || user.id <= 0 || !workspace || user.status !== 'active' || typeof user.name !== 'string' || typeof user.email !== 'string' || (workspace !== 'admin' && (!Number.isSafeInteger(user.active_organization_id) || user.active_organization_id <= 0))) fail(403, 'IDENTITY_UNSUPPORTED', 'Active account permissions and organization context need verification.');
    return { id: user.id, name: user.name, email: user.email, systemRole: user.system_role, workspace, organizationId: Number.isSafeInteger(user.active_organization_id) && user.active_organization_id > 0 ? user.active_organization_id : null };
  }
  function grantsFor(user) {
    if (user.workspace !== 'admin') fail(403, 'ADMIN_REQUIRED', 'Admin authorization is required.');
    let all;
    try { all = JSON.parse(env.CRM_READ_GRANTS_JSON || '{}'); } catch { fail(503, 'GRANTS_INVALID', 'CRM access configuration needs review.'); }
    const grants = Object.hasOwn(all, String(user.id)) ? all[String(user.id)] : null;
    if (!grants || typeof grants !== 'object' || Array.isArray(grants)) fail(403, 'CRM_SCOPE_REQUIRED', 'No CRM record scope is assigned to this account.');
    return grants;
  }
  function moduleGrant(grants, module) {
    if (!namePattern.test(module) || !Object.hasOwn(grants, module)) fail(403, 'CRM_SCOPE_DENIED', 'This CRM scope is not authorized.');
    const grant = grants[module];
    if (!Array.isArray(grant?.recordIds) || !grant.recordIds.every(id => typeof id === 'string' && recordPattern.test(id)) || !Array.isArray(grant.fields) || !grant.fields.length || grant.fields.length > 50 || !grant.fields.every(f => typeof f === 'string' && namePattern.test(f))) fail(503, 'GRANTS_INVALID', 'CRM record and field grants need review.');
    return grant;
  }
  async function accessToken(force = false) {
    if (!force && token && token.expires > now()) return token;
    if (refreshing) return refreshing;
    refreshing = (async () => {
      if (!env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET || !env.ZOHO_REFRESH_TOKEN || !env.ZOHO_ACCOUNTS_URL) fail(503, 'ZOHO_NOT_CONFIGURED', 'Zoho OAuth is not configured. The MCP connection does not supply REST credentials.');
      let accounts;
      try { accounts = new URL(env.ZOHO_ACCOUNTS_URL); } catch { fail(503, 'ZOHO_CONFIG_INVALID', 'Zoho regional configuration needs review.'); }
      if (accounts.protocol !== 'https:' || !accountsHosts.has(accounts.hostname) || accounts.port || accounts.username || accounts.password || accounts.pathname !== '/' || accounts.search || accounts.hash) fail(503, 'ZOHO_CONFIG_INVALID', 'Zoho regional configuration needs review.');
      const response = await request(`${accounts.origin}/oauth/v2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', client_id: env.ZOHO_CLIENT_ID, client_secret: env.ZOHO_CLIENT_SECRET, refresh_token: env.ZOHO_REFRESH_TOKEN }) });
      handleRateLimit(response);
      if (!response.ok) fail(503, 'ZOHO_REFRESH_FAILED', 'Zoho authorization could not be refreshed.');
      const data = await json(response);
      let api;
      try { api = new URL(data.api_domain); } catch { fail(503, 'ZOHO_REFRESH_FAILED', 'Zoho authorization needs review.'); }
      if (!data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0 || api.protocol !== 'https:' || !apiHosts.has(api.hostname) || api.port || api.username || api.password || api.pathname !== '/' || api.search || api.hash) fail(503, 'ZOHO_REFRESH_FAILED', 'Zoho authorization needs review.');
      token = { value: data.access_token, domain: api.origin, expires: now() + Math.max(0, data.expires_in - 60) * 1000 };
      return token;
    })();
    try { return await refreshing; } finally { refreshing = null; }
  }
  async function zoho(path, retried = false) {
    if (rateLimitedUntil > now()) throw new ServiceError(429, 'RATE_LIMITED', 'Zoho is rate limited. Retry after the indicated delay.', Math.ceil((rateLimitedUntil - now()) / 1000));
    const access = await accessToken();
    const response = await request(`${access.domain}/crm/v8/${path}`, { headers: { Authorization: `Zoho-oauthtoken ${access.value}` } });
    if (response.status === 401 && !retried) { token = null; await accessToken(true); return zoho(path, true); }
    handleRateLimit(response);
    if ([401, 403].includes(response.status)) fail(403, 'ZOHO_ACCESS_DENIED', 'Zoho denied this operation. Review OAuth scopes and tenant permissions.');
    if (response.status === 404) fail(404, 'CRM_RECORD_UNAVAILABLE', 'This CRM record is unavailable.');
    if (!response.ok) fail(503, 'ZOHO_UNAVAILABLE', 'Zoho could not complete the read request.');
    return response.status === 204 ? { data: [] } : json(response);
  }
  async function modulesFor(grants) {
    const result = await zoho('settings/modules');
    if (!Array.isArray(result.modules)) fail(502, 'INVALID_RESPONSE', 'Zoho module metadata is unavailable.');
    return result.modules.filter(m => namePattern.test(m.api_name) && m.api_supported === true && m.viewable === true && m.visible !== false && Object.hasOwn(grants, m.api_name)).map(m => ({ apiName: m.api_name, label: String(m.plural_label || m.api_name), readOnly: true }));
  }
  async function readRecord(module, id, grant) {
    // Object authorization BEFORE requesting a record, even for an authenticated Admin.
    if (!recordPattern.test(id) || !grant.recordIds.includes(id)) fail(403, 'CRM_SCOPE_DENIED', 'This CRM record is not authorized.');
    const result = await zoho(`${module}/${id}?fields=${encodeURIComponent(grant.fields.join(','))}`);
    const row = result.data?.[0];
    if (!row || row.id !== id) fail(404, 'CRM_RECORD_UNAVAILABLE', 'This CRM record is unavailable.');
    // Field grants also limit related lookup objects: never pass nested provider data through.
    const fields = Object.fromEntries(grant.fields.filter(f => f !== 'id').map(f => [f, ['string', 'number', 'boolean'].includes(typeof row[f]) ? row[f] : null]));
    return { id, fields, orderLinks: [] }; // A verified Xano link/assignment contract is not available.
  }

  return async function handle({ method = 'GET', url, headers = new Headers(), body }) {
    try {
      const parsed = new URL(url, 'https://local.invalid');
      const route = parsed.searchParams.get('route') || parsed.pathname.replace(/^\/api\//, '');
      if (route === 'status' && method === 'GET') return { status: 200, data: { authenticationConfigured: configured('XANO_AUTH_BASE_URL'), authenticationAvailable: authAvailable(), bookingReadsAvailable: bookingReadsAvailable(), bookingWritesAvailable: false, deliveryAvailable: false, crmAvailable: false } };
      if (['auth/login', 'auth/signup'].includes(route)) {
        if (method !== 'POST') fail(405, 'METHOD_NOT_ALLOWED', 'Use POST for account access.');
        requireAuthRelease();
        if (!headers.get('content-type')?.startsWith('application/json')) fail(415, 'JSON_REQUIRED', 'JSON is required.');
        const { email, password, name } = body || {};
        if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8 || password.length > 256 || (route === 'auth/signup' && (typeof name !== 'string' || !name.trim() || name.length > 100))) fail(400, 'INVALID_INPUT', 'Enter a valid name, email and password (8–256 characters).');
        const data = await xano(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), password, ...(route === 'auth/signup' ? { name: name.trim() } : {}) }) });
        if (typeof data?.authToken !== 'string' || !/^[^\s]{1,4096}$/.test(data.authToken)) fail(502, 'INVALID_RESPONSE', 'Account response needs verification.');
        const user = await authenticate(new Headers({ Authorization: `Bearer ${data.authToken}` }));
        return { status: 200, data: { authToken: data.authToken, user } };
      }
      const user = await authenticate(headers);
      if (route === 'auth/me' && method === 'GET') return { status: 200, data: { user } };
      if (route === 'bookings' || route.startsWith('bookings/') || route.startsWith('consent-attempts/')) {
        if (user.workspace !== 'customer') fail(403, 'CUSTOMER_SCOPE_REQUIRED', 'Customer organization authorization is required. Assigned-trip and Admin oversight contracts are not enabled.');
        if (method !== 'GET') fail(503, 'BOOKING_WRITES_PENDING', 'Booking commands are unavailable pending published contracts and execution verification. No change was submitted.');
        if (!bookingReadsAvailable()) fail(503, 'BOOKING_RELEASE_PENDING', 'Booking reads are unavailable pending publication and authorization verification in Xano.');
        const allowedParams = new Set(['route', 'page', 'per_page', 'status']);
        if ([...parsed.searchParams.keys()].some(key => !allowedParams.has(key) || parsed.searchParams.getAll(key).length !== 1)) fail(400, 'INVALID_QUERY', 'Unsupported booking query. Organization context comes from the authenticated account.');
        const options = { headers: { Authorization: headers.get('authorization') } };
        if (route === 'bookings') {
          const page = Number(parsed.searchParams.get('page') || 1);
          const perPage = Number(parsed.searchParams.get('per_page') || 20);
          const status = parsed.searchParams.get('status') || '';
          if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(perPage) || perPage < 1 || perPage > 100 || (status && !bookingStatuses.includes(status))) fail(400, 'INVALID_QUERY', 'Invalid booking page or status.');
          const query = new URLSearchParams({ page: String(page), per_page: String(perPage), requested_org_id: String(user.organizationId), ...(status ? { status } : {}) });
          const result = await xano(`bookings?${query}`, options, 'XANO_LOGISTICS_BASE_URL');
          return { status: 200, data: bookingPage(result, user, page, perPage, fail) };
        }
        const match = /^bookings\/([1-9]\d*)$/.exec(route);
        if (match && Number.isSafeInteger(Number(match[1]))) {
          const result = await xano(`bookings/${match[1]}`, options, 'XANO_LOGISTICS_BASE_URL');
          return { status: 200, data: bookingDetail(result, user, Number(match[1]), fail) };
        }
        fail(404, 'ENDPOINT_UNAVAILABLE', 'This booking operation is not enabled.');
      }
      if (route.startsWith('crm/')) {
        if (user.workspace !== 'admin') fail(403, 'ADMIN_REQUIRED', 'Admin authorization is required.');
        if (env.ZOHO_READ_RELEASE !== 'verified') fail(503, 'ZOHO_RELEASE_PENDING', 'Zoho is unavailable. MCP authorization and REST OAuth require separate verification.');
        const grants = grantsFor(user);
        if (method !== 'GET') fail(405, 'READ_ONLY', 'CRM writes are not enabled.');
        if (route === 'crm/modules') return { status: 200, data: { modules: await modulesFor(grants) } };
        if (route === 'crm/records' || route === 'crm/record') {
          const module = parsed.searchParams.get('module') || '';
          const grant = moduleGrant(grants, module);
          const id = parsed.searchParams.get('id') || '';
          if (route === 'crm/record' && !grant.recordIds.includes(id)) fail(403, 'CRM_SCOPE_DENIED', 'This CRM record is not authorized.');
          if (!(await modulesFor(grants)).some(m => m.apiName === module)) fail(403, 'MODULE_UNAVAILABLE', 'This module is not available with current tenant permissions.');
          if (route === 'crm/record') return { status: 200, data: { record: await readRecord(module, id, grant) } };
          const page = Number(parsed.searchParams.get('page') || '1');
          if (!Number.isSafeInteger(page) || page < 1 || page > 10000) fail(400, 'INVALID_PAGE', 'Invalid page.');
          const ids = [...new Set(grant.recordIds)];
          const pageSize = 10;
          const records = [];
          // Sequential bounded reads avoid request bursts. Never read ungranted tenant records.
          for (const recordId of ids.slice((page - 1) * pageSize, page * pageSize)) records.push(await readRecord(module, recordId, grant));
          return { status: 200, data: { records, page, nextPage: page * pageSize < ids.length ? page + 1 : null } };
        }
      }
      fail(404, 'ENDPOINT_UNAVAILABLE', 'This operation is not connected to an approved API contract.');
    } catch (error) {
      const safe = error instanceof ServiceError ? error : new ServiceError(500, 'INTERNAL_ERROR', 'The request could not be completed.');
      return { status: safe.status, data: { error: { code: safe.code, message: safe.message, ...(safe.retryAfter ? { retryAfter: safe.retryAfter } : {}) } }, retryAfter: safe.retryAfter };
    }
  };
}
