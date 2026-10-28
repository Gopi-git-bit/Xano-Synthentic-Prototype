export class ApiError extends Error {
  constructor(public code: string, message: string, public retryAfter?: number) { super(message); }
}
let authToken: string | null = null;
let sessionVersion = 0;
let sessionRequests = new AbortController();
type SessionEnd = 'signed-out' | 'expired';
const sessionListeners = new Set<(reason: SessionEnd) => void>();
export function onSessionEnd(listener: (reason: SessionEnd) => void) {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}
export function clearSession(reason: SessionEnd = 'signed-out') {
  authToken = null;
  sessionVersion += 1;
  sessionRequests.abort();
  sessionRequests = new AbortController();
  sessionListeners.forEach(listener => listener(reason));
}
export async function api<T>(route: string, body?: object, options: { signal?: AbortSignal } = {}): Promise<T> {
  const token = authToken;
  const version = sessionVersion;
  const cancelled = () => options.signal?.aborted || (token !== null && version !== sessionVersion);
  const cancellation = () => new ApiError('REQUEST_CANCELLED', 'Request cancelled.');
  let response: Response;
  try {
    const signals = [AbortSignal.timeout(20000), ...(token ? [sessionRequests.signal] : []), ...(options.signal ? [options.signal] : [])];
    // Preserve Vercel's same-origin Preview access cookie; Xano identity still uses the bearer token.
    response = await fetch(`/api/${route}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.any(signals) });
  } catch {
    if (cancelled()) throw cancellation();
    throw new ApiError('UNAVAILABLE', 'Service unavailable or timed out. No successful outcome is confirmed.');
  }
  if (cancelled()) throw cancellation();
  // End only the session that made this request, even when the denial body is not JSON.
  if (response.status === 401 && token) {
    clearSession('expired');
    throw new ApiError('AUTH_REQUIRED', 'Your session has ended. Sign in again to continue.');
  }
  let result;
  try { result = await response.json(); } catch {
    if (cancelled()) throw cancellation();
    throw new ApiError('UNAVAILABLE', 'The API adapter is unavailable. Retry after configuration.');
  }
  if (cancelled()) throw cancellation();
  if (!response.ok) {
    if (token && ['IDENTITY_UNSUPPORTED', 'AUTH_RELEASE_PENDING'].includes(result?.error?.code)) clearSession('expired');
    throw new ApiError(result?.error?.code || 'REQUEST_FAILED', result?.error?.message || 'Request failed.', result?.error?.retryAfter);
  }
  return result;
}
export async function signIn(mode: 'login' | 'signup', data: { name?: string; email: string; password: string }) {
  clearSession();
  const version = sessionVersion;
  const result = await api<{ authToken: string; user: User }>(`auth/${mode}`, data);
  if (version !== sessionVersion) throw new ApiError('REQUEST_CANCELLED', 'Account request cancelled.');
  authToken = result.authToken; // Memory only; no localStorage, URL or role hints.
  return result; // Server revalidates auth/me before releasing this session.
}
export type User = { id: number; name: string; email: string; systemRole: string; workspace: 'customer' | 'owner' | 'admin'; organizationId: number | null };
export type ServiceStatus = { authenticationConfigured: boolean; authenticationAvailable: boolean; bookingReadsAvailable: boolean; bookingWritesAvailable: false; deliveryAvailable: false; crmAvailable: false };
