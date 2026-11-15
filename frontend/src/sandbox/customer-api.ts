export type SandboxBooking = { id: number; reference: string; pickupCity: string; deliveryCity: string; version: number; status: 'draft' };
export type SandboxSession = {
  user: { id: number; name: string; email: string };
  organization: { id: number; name: string; verification: 'pending_human_review' };
  membership: { role: 'owner'; active: true }; bookingScope: 'draft_only'; expiresAt: number;
};
export type DraftInput = {
  request_id: string; pickup_city: string; pickup_street: string; delivery_city: string; delivery_street: string;
  pickup_window_start: number; pickup_window_end: number; delivery_window_start: number; delivery_window_end: number;
};
export class SandboxApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
const booking = (value: unknown): value is SandboxBooking => object(value) && id(value.id) && text(value.reference)
  && text(value.pickupCity) && text(value.deliveryCity) && value.version === 1 && value.status === 'draft';
const session = (value: unknown): value is SandboxSession => object(value) && object(value.user) && object(value.organization)
  && object(value.membership) && id(value.user.id) && text(value.user.name) && text(value.user.email)
  && id(value.organization.id) && text(value.organization.name) && value.organization.verification === 'pending_human_review'
  && value.membership.role === 'owner' && value.membership.active === true && value.bookingScope === 'draft_only'
  && typeof value.expiresAt === 'number' && Number.isSafeInteger(value.expiresAt) && value.expiresAt > Date.now();

// A 2xx response is not proof of the draft-only contract. Never substitute mock success.
function verified(path: string, value: unknown, write: boolean) {
  if (!object(value)) return false;
  if (path === 'csrf') return text(value.csrf);
  if (path === 'auth/register') return value.verification === 'pending_human_review' && value.bookingScope === 'draft_only';
  if (path === 'auth/login') return text(value.csrf) && session(value);
  if (path === 'auth/me' || path === 'organization/membership') return session(value);
  if (path === 'auth/logout') return value.loggedOut === true;
  if (path === 'bookings') return write
    ? booking(value.booking) && value.draftOnly === true && value.executionEnabled === false
    : Array.isArray(value.items) && value.items.length <= 100 && value.items.every(booking)
      && new Set(value.items.map(row => row.id)).size === value.items.length && (value.nextPage === null || value.nextPage === 2);
  return /^bookings\/[1-9]\d*$/.test(path) && booking(value.booking) && value.booking.id === Number(path.split('/')[1])
    && Array.isArray(value.allowedActions) && value.allowedActions.length === 0;
}

// No browser token, password persistence, external URL or arbitrary endpoint passthrough.
export function createCustomerApi() {
  let csrf = '';
  let challenge: Promise<void> | undefined;
  async function request<T>(path: string, payload?: object): Promise<T> {
    let response: Response;
    try {
      response = await fetch('/api/sandbox/' + path, { method: payload ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        headers: payload ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : { Accept: 'application/json' },
        ...(payload ? { body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(45000) });
    } catch { throw new SandboxApiError(503, 'Protected sandbox is unavailable. The outcome is uncertain; retry an unchanged draft to reuse its request ID.'); }
    if (!response.ok) {
      if ([401, 403].includes(response.status)) { csrf = ''; challenge = undefined; }
      // Never display arbitrary upstream/provider response text.
      const messages: Record<number, string> = { 400: 'Check the synthetic input and request ID.', 401: 'Session expired or credentials invalid. Sign in again.',
        403: 'Current session or organization access was denied. Refresh and sign in again.', 404: 'Draft not found in your organization.',
        429: 'Too many attempts. Please wait before trying again.', 503: 'Verified protected sandbox is unavailable or expired.' };
      throw new SandboxApiError(response.status, messages[response.status] || 'Sandbox response could not be verified. No successful outcome is confirmed.');
    }
    let data: unknown;
    try { data = await response.json(); } catch { throw new SandboxApiError(502, 'Sandbox response could not be read.'); }
    if (!verified(path, data, payload !== undefined)) throw new SandboxApiError(502, 'Sandbox response could not be verified. No successful outcome is confirmed.');
    return data as T;
  }
  async function initialize() {
    challenge ??= request<{ csrf: string }>('csrf').then(data => { csrf = data.csrf; }).catch(error => { challenge = undefined; throw error; });
    await challenge;
  }
  async function post<T>(path: string, payload: object) { await initialize(); return request<T>(path, payload); }
  return {
    async register(input: { name: string; organization_name: string; email: string; password: string }) {
      return post<{ verification: 'pending_human_review' }>('auth/register', input);
    },
    async login(email: string, password: string) {
      const result = await post<SandboxSession & { csrf: string }>('auth/login', { email, password });
      csrf = result.csrf; return result;
    },
    async identity() { await initialize(); return request<SandboxSession>('auth/me'); },
    membership: () => request<SandboxSession>('organization/membership'),
    createDraft: (input: DraftInput) => post<{ booking: SandboxBooking }>('bookings', input),
    list: () => request<{ items: SandboxBooking[]; nextPage: number | null }>('bookings'),
    detail: (id: number) => request<{ booking: SandboxBooking }>('bookings/' + id),
    async logout() { await post('auth/logout', {}); csrf = ''; challenge = undefined; },
  };
}
