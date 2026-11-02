// Anonymous read/denial checks only. Never logs response bodies or uses metadata credentials.
const base = process.env.XANO_AUTH_BASE_URL;
const logistics = process.env.XANO_LOGISTICS_BASE_URL;
for (const [name, origin, path] of [['auth-me-anonymous', base, 'auth/me'], ['bookings-anonymous', logistics, 'bookings']]) {
  if (!origin) { console.log(JSON.stringify({ name, result: 'base_not_configured' })); continue; }
  const url = new URL(`${origin.replace(/\/$/, '')}/${path}`);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid Xano base URL');
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
    let body;
    try { body = await response.json(); } catch { body = undefined; }
    console.log(JSON.stringify({ name, http: response.status, responseKind: body === null ? 'null' : Array.isArray(body) ? 'array' : typeof body, interpretation: [401, 403].includes(response.status) ? 'anonymous_denied' : 'unexpected_response_requires_review_not_success' }));
  } catch { console.log(JSON.stringify({ name, result: 'unavailable_no_success_confirmed' })); }
}
