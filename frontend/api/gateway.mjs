import { createGateway } from '../server/gateway.mjs';
const handle = createGateway();

export default async function gateway(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body && req.method === 'POST') {
      let text = '';
      for await (const chunk of req) {
        text += chunk;
        if (Buffer.byteLength(text) > 16384) { res.statusCode = 413; return res.end(); }
      }
      body = JSON.parse(text || '{}');
    }
    if (body && Buffer.byteLength(JSON.stringify(body)) > 16384) { res.statusCode = 413; return res.end(); }
  } catch { res.statusCode = 400; return res.end(); }
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
  const result = await handle({ method: req.method, url: req.url, headers, body });
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json');
  if (result.retryAfter) res.setHeader('Retry-After', String(result.retryAfter));
  res.end(JSON.stringify(result.data));
}
