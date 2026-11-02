import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createGateway } from '../server/gateway.mjs';

// Operator-only, bounded verification through the SAME gateway as the frontend.
// Never overrides release flags, creates an identity, logs secrets, or lists tenant records.
const file = process.argv[2];
let privateEnv = {};
if (file) {
  try { privateEnv = parseEnv(await readFile(file, 'utf8')); }
  catch { console.error('Private environment file could not be loaded.'); process.exit(1); }
}
const env = { ...privateEnv, ...process.env };
const keys = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'ZOHO_ACCOUNTS_URL', 'ZOHO_READ_RELEASE', 'CRM_READ_GRANTS_JSON', 'XANO_AUTH_RELEASE', 'XANO_AUTH_BASE_URL'];
const report = {
  checkedAt: new Date().toISOString(),
  configuration: Object.fromEntries(keys.map(key => [key, env[key] ? 'present' : 'absent'])),
  REST_API_VERIFIED: false,
  AUTHORIZED_RECORD_READ_VERIFIED: false,
  PRODUCTION_RELEASE_BLOCKED: true,
  checks: [],
};
const handle = createGateway({ env });
const status = await handle({ url: '/api/status' });
report.status = status.data;
if (!status.data.authenticationAvailable || !status.data.crmConfigured || !status.data.crmReleaseAuthorized || !env.ZIPPY_TEST_ADMIN_TOKEN) {
  report.checks.push({ operation: 'authenticated_gateway', result: 'blocked', reason: 'Requires configured REST OAuth, separately verified release gates and a trusted test-admin session.' });
} else {
  const headers = new Headers({ Authorization: `Bearer ${env.ZIPPY_TEST_ADMIN_TOKEN}` });
  const metadata = await handle({ url: '/api/crm/modules', headers });
  report.checks.push({ operation: 'oauth_refresh_and_v8_modules', httpStatus: metadata.status, ...(metadata.data.error ? { code: metadata.data.error.code } : { modules: metadata.data.modules.map(m => m.apiName) }) });
  report.REST_API_VERIFIED = metadata.status === 200;
  if (metadata.status === 200 && env.ZOHO_TEST_MODULE && env.ZOHO_TEST_RECORD_ID) {
    const query = new URLSearchParams({ module: env.ZOHO_TEST_MODULE, id: env.ZOHO_TEST_RECORD_ID });
    const record = await handle({ url: `/api/crm/record?${query}`, headers });
    report.checks.push({ operation: 'v8_fields_and_explicitly_granted_record', httpStatus: record.status, ...(record.data.error ? { code: record.data.error.code } : { projectedFieldCount: Object.keys(record.data.record.fields).length }) });
    report.AUTHORIZED_RECORD_READ_VERIFIED = record.status === 200;
  } else report.checks.push({ operation: 'authorized_record', result: 'blocked', reason: 'An explicit approved test module and record ID are required; no record is selected automatically.' });
}
// Only fixed status codes, booleans, presence flags and granted module names are emitted.
console.log(JSON.stringify(report, null, 2));
