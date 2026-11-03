'use strict';
// No credentials, raw responses, password hashes or app tokens are persisted here.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
const base = path.resolve(__dirname, '..');
const output = process.env.ZIPPY_EVIDENCE_DIR ? path.resolve(process.env.ZIPPY_EVIDENCE_DIR) : path.join(base, '.sandbox');
const config = JSON.parse(fs.readFileSync(process.env.ZIPPY_TARGET || path.join(base, 'target.local.json'), 'utf8'));
const {origin, tenant, source_workspace_id: sourceId, workspace_id: workspaceId} = config;
assert.equal(new URL(origin).origin, origin);
assert.ok(origin.startsWith('https://') && !new URL(origin).username && !new URL(origin).password);
assert.match(tenant, /^[a-z0-9]+(?:-[a-z0-9]+)+$/);
for (const id of [sourceId, workspaceId, config.tenant_id]) assert.ok(Number.isSafeInteger(id) && id > 0);
const credentials = yaml.load(fs.readFileSync(process.env.XANO_CONFIG || path.join(os.homedir(), '.xano', 'credentials.yaml'), 'utf8'));
const profile = credentials.profiles[config.profile];
assert.equal(profile.instance_origin, origin, 'Profile origin must match explicit target');
assert.equal(profile.workspace, sourceId, 'Profile must match parent workspace');
assert.ok(profile.access_token);
const tenantBase = origin + '/tenant/' + tenant;
const metaBase = tenantBase + '/api:meta/workspace/' + workspaceId;
const receipts = [];
let verifiedUntil = 0;
async function fetchJSON(url, method, body, headers) {
  const r = await fetch(url, {method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(60000)});
  let data; try { data = await r.json(); } catch { data = null; }
  return {status: r.status, data};
}
async function verify({prepare=false}={}) {
  verifiedUntil = 0;
  const headers = {Authorization: 'Bearer ' + profile.access_token};
  const r = await fetchJSON(origin + '/api:meta/workspace/' + sourceId + '/tenant/' + tenant, 'GET', undefined, headers);
  assert.equal(r.status, 200, 'Cannot verify target tenant');
  const t = r.data;
  assert.equal(t.id, config.tenant_id); assert.equal(t.name, tenant);
  assert.equal(t.type, 'ephemeral');
  assert.equal(t.state, 'ok');
  if (t.workspace) assert.equal(t.workspace.id, sourceId);
  const expiry = new Date(t.ephemeral_expires_at).getTime();
  assert.ok(expiry > Date.now(), 'Tenant expired');
  const ws = await fetchJSON(tenantBase + '/api:meta/workspace', 'GET', undefined, headers);
  assert.equal(ws.status, 200);
  const workspaces = Array.isArray(ws.data) ? ws.data : ws.data.items;
  assert.ok(workspaces.some(w => w.id === workspaceId && w.name === tenant), 'Internal workspace mismatch');
  if (prepare && t.tasks) {
    const tables=await fetchJSON(metaBase+'/table', 'GET', undefined, headers);
    assert.equal(tables.status,200);
    assert.equal((Array.isArray(tables.data)?tables.data:tables.data.items).length,0,'Task configuration requires a fresh empty tenant');
    // CLI 1.3.4 converts null domains to empty strings, which can collide across tenants.
    const body={description:t.description,display:t.display,domain:t.domain??null,proxy:t.proxy??null,ingress:t.ingress,rbac:t.rbac,tag:t.tag,tasks:false};
    const updated=await fetchJSON(origin+'/api:meta/workspace/'+sourceId+'/tenant/'+tenant,'PUT',body,{...headers,'Content-Type':'application/json'});
    assert.equal(updated.status,200,'Cannot disable fresh-tenant tasks');
    return verify();
  }
  assert.equal(t.tasks,false);
  verifiedUntil = expiry;
  return {id:t.id, name:t.name, workspace_id:workspaceId, type:t.type, tasks:t.tasks, expires_at:t.ephemeral_expires_at};
}
async function request(route, method='GET', body, {runtime=false, token}={}) {
  assert.ok(verifiedUntil > Date.now(), 'Call verify() before tenant access');
  assert.ok(route.startsWith('/') && !route.startsWith('//') && !/[\\#]/.test(route) && !route.includes('..') && !route.includes('%'), 'Invalid route');
  const headers = {'Content-Type':'application/json'};
  if (!runtime) headers.Authorization = 'Bearer ' + profile.access_token;
  else if (token) headers.Authorization = 'Bearer ' + token;
  const result = await fetchJSON((runtime ? tenantBase : metaBase) + route, method, body, headers);
  receipts.push({method, route, status:result.status});
  return result;
}
async function ok(route, method, body, options) {
  const r = await request(route, method, body, options);
  assert.ok(r.status >= 200 && r.status < 300, (method || 'GET') + ' ' + route + ': HTTP ' + r.status);
  return r.data;
}
async function list(kind, extra='') {
  const items=[]; let page=1;
  do {
    const d=await ok('/'+kind+'?branch=v1&per_page=100&page='+page+extra);
    items.push(...(Array.isArray(d)?d:d.items)); page=d.nextPage||null;
  } while(page);
  return items;
}
function save(name, data) {
  assert.match(name, /^[a-z0-9-]+$/);
  const text=JSON.stringify(data,null,2)+'\n';
  assert.ok(!text.includes(profile.access_token));
  assert.ok(!/"(?:password|authToken|access_token|refresh_token|gateway_response|otp_code|claim_token)"\s*:/i.test(text), 'Refusing sensitive output');
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,name+'.json'),text);
}
function load(name) { return JSON.parse(fs.readFileSync(path.join(output,name+'.json'),'utf8')); }
module.exports={verify,request,ok,list,save,load,receipts,tenant,tenantBase,output,config};
