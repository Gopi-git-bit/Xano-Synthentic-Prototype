import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';

// CLI-only read-only metadata probe. Never prints the secret URL or raw upstream responses.
const file = process.argv[2];
const env = file ? { ...parseEnv(await readFile(file, 'utf8')), ...process.env } : process.env;
const report = { checkedAt: new Date().toISOString(), configuration: {}, transport: {}, tools: [], result: 'not_configured' };
for (const key of ['ZOHO_CRM_MCP_URL', 'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'XANO_AUTH_BASE_URL']) report.configuration[key] = env[key] ? 'set' : 'missing';
if (env.ZOHO_CRM_MCP_URL) {
  try {
    const endpoint = new URL(env.ZOHO_CRM_MCP_URL);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Invalid configuration');
    report.transport.host = endpoint.hostname;
    let session;
    let counter = 0;
    async function rpc(method, params = {}) {
      const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
      if (session) headers['Mcp-Session-Id'] = session;
      const r = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: ++counter, method, params }), redirect: 'error', signal: AbortSignal.timeout(15000) });
      report.transport.lastHttpStatus = r.status;
      session = r.headers.get('mcp-session-id') || session;
      if (!r.ok) throw new Error('Upstream unavailable');
      const text = await r.text();
      const messages = r.headers.get('content-type')?.includes('text/event-stream') ? text.split('\n').filter(l => l.startsWith('data:')).map(l => JSON.parse(l.slice(5))) : [JSON.parse(text)];
      const message = messages.find(m => m.id === counter);
      if (!message?.result) throw new Error('Unsupported response');
      return message.result;
    }
    const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'zippy-readonly-audit', version: '1.0.0' } });
    report.transport.protocol = init.protocolVersion;
    const result = await rpc('tools/list');
    report.tools = (result.tools || []).map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations }));
    report.result = 'metadata_discovery_succeeded_no_records_accessed';
  } catch { report.result = 'connection_or_discovery_failed'; }
}
await mkdir('docs', { recursive: true });
let serialized = JSON.stringify(report, null, 2);
for (const [key, value] of Object.entries(env)) if (/ZOHO|TOKEN|SECRET|KEY/.test(key) && value && value.length > 8) serialized = serialized.replaceAll(value, '[REDACTED]');
await writeFile('docs/zoho-connectivity.json', serialized + '\n');
console.log(JSON.stringify({ ...report, tools: report.tools.map(t => ({ name: t.name, parameters: Object.keys(t.inputSchema?.properties || {}) })) }, null, 2).replaceAll(env.ZOHO_CRM_MCP_URL || '__absent__', '[REDACTED]'));
