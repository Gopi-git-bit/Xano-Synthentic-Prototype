import { readdir, readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { join } from 'node:path';

const privateFile = process.argv[2];
const secrets = privateFile ? Object.values(parseEnv(await readFile(privateFile, 'utf8'))).filter(v => v.length > 8) : [];
async function files(dir) { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))).flat(); }
const violations = [];
for (const file of await files('dist')) {
  if (!/\.(js|css|html|json|map)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  if (secrets.some(value => text.includes(value)) || /ZOHO_CLIENT_SECRET|ZOHO_REFRESH_TOKEN|CRM_READ_GRANTS_JSON/.test(text)) violations.push(file);
}
if (violations.length) { console.error('Browser secret scan failed:', violations); process.exitCode = 1; }
else console.log(`Browser secret scan passed. ${secrets.length} private configuration values checked; no values printed.`);
