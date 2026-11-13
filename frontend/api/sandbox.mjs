import { createSandboxGateway } from '../server/sandbox-gateway.mjs';
const handle = createSandboxGateway();

export default async function sandbox(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Cookie, Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json');
  const reject = status => { res.statusCode = status; res.end(JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Invalid sandbox request.' } })); };
  let body = req.body;
  try {
    if (Number(req.headers['content-length']) > 8192) return reject(413);
    if (typeof body === 'string') { if (Buffer.byteLength(body) > 8192) return reject(413); body = JSON.parse(body); }
    if (body === undefined && req.method === 'POST') {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += Buffer.byteLength(chunk); if (size > 8192) return reject(413); chunks.push(Buffer.from(chunk)); }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    }
    if (body !== undefined && Buffer.byteLength(JSON.stringify(body)) > 8192) return reject(413);
  } catch { return reject(400); }
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
  // Vercel overwrites this platform header. Missing identity shares one restrictive bucket.
  const result = await handle({ method: req.method, url: req.url, headers, body, clientIp: headers.get('x-vercel-forwarded-for') || 'unknown' });
  res.statusCode = result.status;
  if (result.cookies) res.setHeader('Set-Cookie', result.cookies);
  if (result.retryAfter) res.setHeader('Retry-After', String(result.retryAfter));
  res.end(JSON.stringify(result.data));
}
