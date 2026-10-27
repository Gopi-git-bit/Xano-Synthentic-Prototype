export class ApiError extends Error {
  constructor(public code: string, message: string, public retryAfter?: number) { super(message); }
}
let authToken: string | null = null;
export function clearSession() { authToken = null; }
export async function api<T>(route: string, body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${route}`, { method: body ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  } catch { throw new ApiError('UNAVAILABLE', 'Service unavailable or timed out. No successful outcome is confirmed.'); }
  let result;
  try { result = await response.json(); } catch { throw new ApiError('UNAVAILABLE', 'The API adapter is unavailable. Retry after configuration.'); }
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(result.error?.code || 'REQUEST_FAILED', result.error?.message || 'Request failed.', result.error?.retryAfter);
  }
  return result;
}
export async function signIn(mode: 'login' | 'signup', data: { name?: string; email: string; password: string }) {
  const result = await api<{ authToken: string }>(`auth/${mode}`, data);
  authToken = result.authToken; // Memory only; no localStorage, URL or role hints.
  try { return await api<{ user: User }>('auth/me'); } catch (error) { clearSession(); throw error; }
}
export type User = { id: number; name: string; email: string; role: 'admin' | 'member' };
