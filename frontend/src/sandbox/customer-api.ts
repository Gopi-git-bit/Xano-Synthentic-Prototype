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
    try { return await response.json() as T; } catch { throw new SandboxApiError(502, 'Sandbox response could not be read.'); }
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
