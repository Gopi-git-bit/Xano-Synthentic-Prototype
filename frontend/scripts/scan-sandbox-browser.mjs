import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Static browser-boundary scan, supplemented by Playwright storage/URL/console/egress checks.
// This is not a hosted penetration test or a substitute for real browser acceptance.
const root = path.resolve('dist-sandbox/assets');
const chunks = fs.readdirSync(root).filter(file => /^CustomerPreview-.*\.js$/.test(file));
assert.equal(chunks.length, 1, 'Build the connected sandbox bundle before scanning');
const source = fs.readFileSync(path.join(root, chunks[0]), 'utf8');
for (const forbidden of [/xynd-fnea-khtp/, /api:meta/, /api:zippy-customer/, /ZIPPY_SANDBOX_(?:SESSION_KEY|REDIS_TOKEN)/,
  /(?:localStorage|sessionStorage)\.setItem/, /dangerouslySetInnerHTML/, /mock-private-xano-token/]) assert.ok(!forbidden.test(source), 'Browser boundary violation');
assert.ok(source.includes('/api/sandbox/'), 'Connected browser must use the sandbox gateway');
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const headers = config.headers.flatMap(rule => rule.headers), csp = headers.find(h => h.key === 'Content-Security-Policy').value;
for (const directive of ["script-src 'self'", "connect-src 'self'", "frame-ancestors 'none'", "form-action 'self'", "base-uri 'self'"]) assert.ok(csp.includes(directive));
assert.equal(config.rewrites[0].source, '/api/sandbox/:path*');
console.log(JSON.stringify({ scope: 'static connected-browser bundle and deployment policy', passed: true, chunks: chunks.map(file => ({ file, sha256: createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') })), assertions: ['no Xano/internal/server-secret references', 'no browser credential storage writes', 'no raw HTML injection sink', 'same-origin gateway requests', 'CSP same-origin connections/scripts and frame denial', 'separate sandbox rewrite precedes production gateway'] }, null, 2));
