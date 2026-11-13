import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

// Shared Redis REST state, independent of serverless process lifetime. No memory fallback.
// Tokens are encrypted at rest; cookie/session IDs and client IPs are HMAC-keyed.
export function createSandboxStore({ url, token, key, namespace, fetchImpl = fetch }) {
  const base = new URL(url);
  if (base.protocol !== 'https:' || !/^[a-z0-9-]+\.upstash\.io$/.test(base.hostname)
    || base.pathname !== '/' || base.port || base.username || base.password || base.search || base.hash
    || !token || !Buffer.isBuffer(key) || key.length !== 32 || !/^[a-z0-9-]{3,100}$/.test(namespace)) throw new Error('Invalid shared store configuration');
  const hash = value => createHmac('sha256', key).update(namespace + ':' + value).digest('hex');
  const redisKey = (kind, value) => `zippy-sandbox:${namespace}:${kind}:${hash(value)}`;
  async function command(args) {
    const response = await fetchImpl(base.href, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args), redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Shared state unavailable');
    const data = await response.json();
    if (!data || data.error || !Object.hasOwn(data, 'result')) throw new Error('Shared state unavailable');
    return data.result;
  }
  function encrypt(value, aad) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(aad));
    const bytes = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64url');
  }
  function decrypt(value, aad) {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(aad)); decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
  }
  return Object.freeze({
    async create(id, value, ttlSeconds) {
      const name = redisKey('session', id);
      if (await command(['SET', name, encrypt(value, name), 'EX', ttlSeconds, 'NX']) !== 'OK') throw new Error('Session creation failed');
    },
    async get(id) {
      const name = redisKey('session', id), value = await command(['GET', name]);
      if (value === null) return null;
      if (typeof value !== 'string' || value.length > 16384) throw new Error('Invalid session state');
      try { return decrypt(value, name); } catch { throw new Error('Invalid session state'); }
    },
    async delete(id) { await command(['DEL', redisKey('session', id)]); },
    async consume(bucket, limit, seconds) {
      const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
      const count = await command(['EVAL', script, 1, redisKey('rate', bucket), seconds]);
      if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid rate state');
      return count <= limit;
    },
  });
}
