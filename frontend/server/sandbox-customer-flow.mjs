// Server-only sandbox test adapter. Never import from the browser or production gateway.
const validId = value => Number.isSafeInteger(value) && value > 0;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error('SANDBOX_CONTRACT: ' + message); };

export function createSandboxCustomerClient({
  authBase,
  bookingsBase,
  expectedOrigin,
  expectedTenant,
  fetchImpl = fetch,
}) {
  if (typeof expectedOrigin !== 'string' || typeof expectedTenant !== 'string'
      || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(expectedTenant)
      || ['live', 'production', 'main'].includes(expectedTenant)) fail('Explicit tenant identity required');
  let trusted;
  try { trusted = new URL(expectedOrigin); } catch { fail('Expected origin is invalid'); }
  if (trusted.protocol !== 'https:' || trusted.pathname !== '/' || trusted.search || trusted.hash
      || trusted.username || trusted.password || trusted.port) fail('Expected origin must be a bare HTTPS origin');

  function verifiedBase(raw, canonical) {
    let u;
    try { u = new URL(raw); } catch { fail('Sandbox API base is invalid'); }
    if (u.origin !== trusted.origin || u.protocol !== 'https:' || u.search || u.hash
        || u.username || u.password || u.port) fail('Sandbox API origin mismatch');
    const match = /^\/tenant\/([a-z0-9-]+)\/api:([a-z0-9-]+)\/?$/.exec(u.pathname);
    if (!match || match[1] !== expectedTenant || match[2] !== canonical)
      fail('Sandbox tenant or API canonical mismatch');
    return u.href.replace(/\/$/, '');
  }

  const auth = verifiedBase(authBase, 'zippy-customer-draft-auth');
  const bookings = verifiedBase(bookingsBase, 'zippy-customer-drafts');

  async function request(base, path, { method = 'GET', payload, token } = {}) {
    const headers = { Accept: 'application/json' };
    if (payload !== undefined) headers['Content-Type'] = 'application/json';
    if (token !== undefined) {
      if (typeof token !== 'string' || !/^[^\s]{1,4096}$/.test(token)) fail('Invalid test bearer token');
      headers.Authorization = 'Bearer ' + token;
    }
    let response;
    try {
      response = await fetchImpl(base + '/' + path, {
        method, headers, redirect: 'error', signal: AbortSignal.timeout(12000),
        ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
      });
    } catch { fail('Sandbox request unavailable'); }
    if (!response || typeof response.status !== 'number') fail('Malformed sandbox transport');
    if (response.status < 200 || response.status >= 300)
      fail('Sandbox HTTP ' + response.status); // Never copy sensitive upstream errors.
    let result;
    try { result = await response.json(); } catch { fail('Unreadable sandbox response'); }
    if (!isObject(result)) fail('Sandbox response must be an object');
    return result;
  }

  return Object.freeze({
    async register(input) {
      if (!isObject(input) || !String(input.email || '').endsWith('@example.invalid')
          || !String(input.name || '').startsWith('SYNTHETIC ')
          || !String(input.organization_name || '').startsWith('SYNTHETIC ')
          || typeof input.password !== 'string' || input.password.length < 12
          || input.password.length > 256
          || Object.keys(input).some(k => !['name', 'email', 'password', 'organization_name', 'phone'].includes(k)))
        fail('Synthetic customer registration required');
      const data = await request(auth, 'auth/register', { method: 'POST', payload: input });
      if (!validId(data.user_id) || !validId(data.organization_id)
          || data.system_role !== 'customer_admin' || data.status !== 'active'
          || data.booking_scope !== 'draft_only'
          || data.verification_state !== 'pending_human_review'
          || !validId(data.approval_request_id) || Object.hasOwn(data, 'authToken'))
        fail('Registration response violates draft-only contract');
      return { userId: data.user_id, organizationId: data.organization_id,
        pendingReviewId: data.approval_request_id };
    },
    async login(email, password) {
      const data = await request(auth, 'auth/login', { method: 'POST', payload: { email, password } });
      if (!validId(data.user_id) || typeof data.authToken !== 'string'
          || !/^[^\s]{1,4096}$/.test(data.authToken)) fail('Invalid login response');
      return { userId: data.user_id, token: data.authToken };
    },
    async identity(token) {
      const data = await request(auth, 'auth/me', { token });
      if (!validId(data.id) || !validId(data.active_organization_id)
          || data.system_role !== 'customer_admin' || data.status !== 'active'
          || typeof data.name !== 'string' || typeof data.email !== 'string')
        fail('Invalid authenticated identity');
      return data;
    },
    async membership(token) {
      const data = await request(auth, 'organization/membership', { token });
      if (!isObject(data.organization) || !isObject(data.membership)
          || !validId(data.organization.id) || !validId(data.membership.user_id)
          || data.booking_scope !== 'draft_only'
          || data.organization.kyb_verified !== false
          || data.membership.member_role !== 'owner') fail('Invalid membership projection');
      return data;
    },
    async createDraft(token, input) {
      const expected = ['request_id', 'pickup_city', 'pickup_street', 'delivery_city',
        'delivery_street', 'pickup_window_start', 'pickup_window_end',
        'delivery_window_start', 'delivery_window_end'];
      if (!isObject(input) || Object.keys(input).length !== expected.length
          || expected.some(key => !Object.hasOwn(input, key))
          || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.request_id)
          || expected.slice(1, 5).some(key => typeof input[key] !== 'string' || !input[key].trim())
          || expected.slice(5).some(key => !Number.isSafeInteger(input[key]) || input[key] <= 0)
          || !(input.pickup_window_start < input.pickup_window_end
            && input.pickup_window_end <= input.delivery_window_start
            && input.delivery_window_start < input.delivery_window_end))
        fail('Invalid synthetic draft request');
      const result = await request(bookings, 'bookings', { method: 'POST', payload: input, token });
      if (!isObject(result.booking) || !validId(result.booking.id)
          || result.booking.status !== 'draft' || result.booking.payment_status !== 'pending'
          || result.booking.version !== 1 || result.draft_only !== true
          || result.execution_enabled !== false) fail('Draft response is not a disabled operational draft');
      return result;
    },
    async listDrafts(token) {
      const page = await request(bookings, 'bookings?page=1&per_page=100&status=draft', { token });
      if (!Array.isArray(page.items) || page.curPage !== 1
          || page.items.some(item => !isObject(item) || !validId(item.id)
            || !validId(item.customer_organization_id) || item.status !== 'draft'))
        fail('Invalid draft booking page');
      return page;
    },
    async detail(token, id) {
      if (!validId(id)) fail('Invalid booking ID');
      const result = await request(bookings, 'bookings/' + id, { token });
      if (!isObject(result.booking) || result.booking.id !== id
          || !validId(result.booking.customer_organization_id)
          || !Array.isArray(result.allowed_actions) || result.allowed_actions.length !== 0
          || !Array.isArray(result.cargo) || !Array.isArray(result.active_holds))
        fail('Invalid draft booking detail');
      return result;
    },
  });
}

export async function runSandboxCustomerFlow(client, fixture) {
  const registration = await client.register(fixture.registration);
  const login = await client.login(fixture.registration.email, fixture.registration.password);
  if (login.userId !== registration.userId) fail('Login does not match registration');
  const identity = await client.identity(login.token);
  if (identity.id !== registration.userId
      || identity.active_organization_id !== registration.organizationId)
    fail('Identity does not match created organization');
  const membership = await client.membership(login.token);
  if (membership.organization.id !== registration.organizationId
      || membership.membership.user_id !== registration.userId) fail('Membership does not match identity');
  const created = await client.createDraft(login.token, fixture.draft);
  if (created.booking.customer_organization_id !== registration.organizationId)
    fail('Draft belongs to a different organization');
  const page = await client.listDrafts(login.token);
  if (!page.items.some(row => row.id === created.booking.id
      && row.customer_organization_id === registration.organizationId))
    fail('Draft is absent from the customer page');
  const detail = await client.detail(login.token, created.booking.id);
  if (detail.booking.customer_organization_id !== registration.organizationId
      || detail.booking.status !== 'draft') fail('Draft detail does not match owner');
  return Object.freeze({
    outcome: 'SANDBOX_CUSTOMER_FLOW_VERIFIED',
    userId: registration.userId,
    organizationId: registration.organizationId,
    reviewId: registration.pendingReviewId,
    bookingId: created.booking.id,
    bookingStatus: detail.booking.status,
    bookingScope: 'draft_only',
    verifiedFinancialActions: false,
  }); // No password, auth token, address, or raw response leaves the adapter.
}
