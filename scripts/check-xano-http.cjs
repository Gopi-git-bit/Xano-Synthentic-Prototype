'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const origin='https://xynd-fnea-khtp.n7e.xano.io';
const tenant='sn9m-aat6-200c';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
async function checkConnection({token,sourceHash,fetchImpl=fetch,applicationBaseUrl=''}) {
  const report={status:'NOT_VERIFIED',ready:false,scope:'Read-only Xano HTTP connection check; no staging acceptance claim',checks:[]};
  const add=(name,status,detail={})=>report.checks.push({name,status,...detail});
  if(!token||!token.trim()||/^https?:|^\{/.test(token.trim())){add('credential','FAIL',{code:'MISSING_OR_INVALID_TOKEN_FORMAT'});return report;}
  const credential=token.trim().replace(/^Bearer\s+/i,'');
  let calls=0; let sessionId; let protocolVersion;
  const mcpPath='/x2/mcp/meta/mcp/stream';
  async function rpcResult(response,id){
    if((response.headers.get('content-type')||'').includes('application/json')){const j=await response.json();if(j.id!==id||j.error)throw Error('MCP_RESPONSE_REJECTED');return j.result;}
    const reader=response.body.getReader();let pending='',bytes=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1000000)throw Error('MCP_RESPONSE_LIMIT');pending+=new TextDecoder().decode(value,{stream:true}).replaceAll('\r\n','\n');let end;while((end=pending.indexOf('\n\n'))>=0){const event=pending.slice(0,end);pending=pending.slice(end+2);const data=event.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trimStart()).join('\n');if(!data)continue;const j=JSON.parse(data);if(j.id===id){if(j.error)throw Error('MCP_RESPONSE_REJECTED');return j.result;}}}throw Error('MCP_RESPONSE_MISSING');}finally{await reader.cancel().catch(()=>{});}
  }
  async function request(path,{authenticated=true,method='GET',body}={}) {
    if(++calls>9)throw Error('REQUEST_LIMIT');
    const isMcp=path===mcpPath;
    if(!path.startsWith('/api:meta/')&&!isMcp)throw Error('DESTINATION_REJECTED');
    const readOnlyRpc=isMcp&&['initialize','notifications/initialized','tools/list'].includes(body?.method);
    const readOnlyProbe=path==='/api:meta/workspace/1/function/run'&&body?.name==='Slice1/isolation_probe';
    if(method!=='GET'&&(method!=='POST'||(!readOnlyProbe&&!readOnlyRpc)))throw Error('OPERATION_REJECTED');
    const headers={Accept:'application/json'};
    if(authenticated)headers.Authorization='Bearer '+credential;
    if(method==='POST'){headers['Content-Type']='application/json';if(!isMcp)headers['X-Tenant']=tenant;}
    if(isMcp){headers.Accept='application/json, text/event-stream';if(sessionId)headers['Mcp-Session-Id']=sessionId;if(protocolVersion)headers['MCP-Protocol-Version']=protocolVersion;}
    return fetchImpl(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(20000)});
  }
  try {
    let r=await request('/api:meta/workspace/1',{authenticated:false});
    if(![401,403].includes(r.status)){add('metadata_requires_authentication','FAIL',{http_status:r.status});return report;}
    add('metadata_requires_authentication','PASS',{http_status:r.status});
    r=await request('/api:meta/auth/me');
    if(r.status!==200){add('metadata_credential','FAIL',{http_status:r.status});return report;}
    const me=await r.json();const scopes=me.extras?.access_token?.scope||{};
    add('metadata_credential','PASS',{http_status:200,live_data_scope_present:Number(scopes['workspace:datasource:live']||0)>0,least_privilege_verified:false});
    r=await request('/api:meta/workspace/1');
    if(r.status!==200){add('workspace_binding','FAIL',{http_status:r.status});return report;}
    const workspace=await r.json();
    if(workspace.id!==1||workspace.name!=='Zippy Synthetic Prototype'||workspace.branch!=='v1'){add('workspace_binding','FAIL',{code:'TARGET_MISMATCH'});return report;}
    add('workspace_binding','PASS',{workspace_id:1,branch:'v1'});
    if(workspace.preferences?.allow_push!==false){add('direct_push_guard','FAIL',{code:'DIRECT_PUSH_NOT_DISABLED'});return report;}
    add('direct_push_guard','PASS');
    r=await request('/api:meta/sandbox/multidoc?env=false&records=false');
    if(r.status!==200){add('sandbox_probe_source','FAIL',{http_status:r.status});return report;}
    const exportText=await r.text();
    if(exportText.length>2000000)throw Error('RESPONSE_LIMIT');
    const doc=exportText.split('\n---\n').map(x=>x.trim()).find(x=>/^function "Slice1\/isolation_probe"\s*\{/.test(x));
    if(!doc||hash(doc)!==sourceHash){add('sandbox_probe_source','FAIL',{code:'SOURCE_DRIFT'});return report;}
    add('sandbox_probe_source','PASS',{sha256:sourceHash});
    r=await request('/api:meta/workspace/1/function/run',{method:'POST',body:{name:'Slice1/isolation_probe',branch:'v1',input:{}}});
    if(r.status!==200){add('sandbox_database_identity','FAIL',{http_status:r.status});return report;}
    const response=await r.json();const probe=response.result?.result;
    if(response.result?.status!=='ok'||probe?.database!==tenant){add('sandbox_database_identity','FAIL',{code:'DATABASE_IDENTITY_NOT_PROVED'});return report;}
    add('sandbox_database_identity','PASS',{database:tenant});
    if(probe.physical_table_count!==51){add('sandbox_physical_inventory','FAIL',{code:'UNEXPECTED_PHYSICAL_TABLE_COUNT',expected_physical_tables:51,observed_physical_tables:Number.isSafeInteger(probe.physical_table_count)?probe.physical_table_count:null});return report;}
    add('sandbox_physical_inventory','PASS',{physical_tables:51});
    r=await request(mcpPath,{method:'POST',body:{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'zippy-readonly-preflight',version:'1.0'}}}});
    if(r.status!==200){add('metadata_mcp_initialize','FAIL',{http_status:r.status});return report;}
    sessionId=r.headers.get('mcp-session-id')||undefined;
    const initialized=await rpcResult(r,1);protocolVersion=initialized?.protocolVersion;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(protocolVersion||''))throw Error('MCP_PROTOCOL_REJECTED');
    add('metadata_mcp_initialize','PASS',{protocol_version:protocolVersion});
    r=await request(mcpPath,{method:'POST',body:{jsonrpc:'2.0',method:'notifications/initialized'}});
    if(![200,202,204].includes(r.status))throw Error('MCP_NOTIFICATION_REJECTED');
    r=await request(mcpPath,{method:'POST',body:{jsonrpc:'2.0',id:2,method:'tools/list',params:{}}});
    if(r.status!==200)throw Error('MCP_TOOL_LIST_REJECTED');
    const listed=await rpcResult(r,2);if(!Array.isArray(listed?.tools))throw Error('MCP_TOOL_LIST_REJECTED');
    add('metadata_mcp_tool_listing','PASS',{tool_count_first_page:listed.tools.length,listing_complete:!listed.nextCursor,tools_executed:0});
    if(!applicationBaseUrl){add('public_application_http','NOT_VERIFIED',{code:'ISOLATED_APPLICATION_URL_REQUIRED'});}
    else {
      let base;try{base=new URL(applicationBaseUrl);}catch{throw Error('APPLICATION_URL_REJECTED');}
      if(base.protocol!=='https:'||base.origin===origin||!base.hostname.endsWith('.xano.io')||base.username||base.password||base.search||base.hash)throw Error('APPLICATION_URL_REJECTED');
      const prefix=base.href.replace(/\/$/,'');
      for(const [route,expected] of [['api/v1/health',[200]],['api/v1/orders',[401,403]]]){
        const app=await fetchImpl(prefix+'/'+route,{method:'GET',headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
        add('public_'+route,expected.includes(app.status)?'PASS':'FAIL',{http_status:app.status});
      }
      add('authenticated_application_roles','NOT_VERIFIED',{code:'APPLICATION_USER_TEST_CREDENTIALS_REQUIRED'});
    }
    report.status=report.checks.some(x=>x.status==='FAIL')?'FAIL':'PASS_METADATA_ONLY';
  }catch{add('bounded_http_execution','FAIL',{code:'REQUEST_OR_RESPONSE_REJECTED'});report.status='FAIL';}
  return report;
}
module.exports={checkConnection};
if(require.main===module){
  (async()=>{
    const identity=['workflow_dispatch','Gopi-git-bit/Xano-Synthentic-Prototype','refs/heads/codex/xano-backend-review','200721521'];
    const actual=[process.env.GITHUB_EVENT_NAME,process.env.GITHUB_REPOSITORY,process.env.GITHUB_REF,process.env.GITHUB_ACTOR_ID];
    if(!identity.every((v,i)=>v===actual[i])||process.env.GITHUB_SHA!==process.env.EXPECTED_SHA||!/^[a-f0-9]{40}$/.test(process.env.EXPECTED_SHA||''))throw Error('EXECUTION_CONTEXT_REJECTED');
    const manifest=JSON.parse(fs.readFileSync('backend/evidence/tested-export.json','utf8'));
    const sourceHash=manifest.files.find(f=>f.path==='function/slice_1/isolation_probe.xs')?.sha256;
    if(!sourceHash)throw Error('PINNED_SOURCE_REQUIRED');
    const report=await checkConnection({token:process.env.XANO_METADATA_API,sourceHash,applicationBaseUrl:process.env.XANO_TEST_BASE_URL||''});
    report.commit=process.env.GITHUB_SHA;report.environment='Xano-Production';report.captured_at=new Date().toISOString();
    fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/xano-http-connection.json',JSON.stringify(report,null,2)+'\n');
    for(const c of report.checks)console.log(c.name+': '+c.status+(c.http_status?' HTTP '+c.http_status:''));
    console.log('Scope: metadata connection only. Staging readiness remains unverified.');
    if(report.status!=='PASS_METADATA_ONLY')process.exitCode=1;
  })().catch(()=>{console.error('Connection check rejected before execution; no secret values displayed.');process.exitCode=1;});
}
