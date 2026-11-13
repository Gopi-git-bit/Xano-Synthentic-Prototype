'use strict';
// Pure filesystem allowlist. Creates a NEW import directory; never calls Xano.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),review=path.join(root,'backend/reconciliation-20261029');
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out),'Supply a new output directory');
const inventory=JSON.parse(fs.readFileSync(path.join(review,'evidence/published-inventory.json')));
const functions=new Set(['security/resolve_context','security/authorize_resource','Quick Start/log_event']);
const authQueries=new Set(['auth/login','auth/me','auth/signup','reset/request-reset-link','reset/magic-link-login','reset/update_password','message/send_welcome_email']);
const selected=inventory.documents.filter(d=>d.type==='table'||d.type==='api_group'&&['Authentication','Zippy_V1'].includes(d.name)||d.type==='function'&&functions.has(d.name)||d.type==='query'&&(d.group==='Zippy_V1'||d.group==='Authentication'&&authQueries.has(d.name)));
assert.equal(selected.length,59);fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),files=[];
for(const d of selected){
 const refusal=d.type==='query'&&d.group==='Zippy_V1'&&d.verb!=='GET';
 const source=refusal?path.join(review,d.file.replace(/^published\//,'candidate/')):path.join(review,'evidence',d.file);
 const bytes=fs.readFileSync(source),text=bytes.toString();
 if(!refusal)assert.equal(hash(text.trim()),d.sha256);
 assert.doesNotMatch(text,/\b(?:api\.request|ai\.|db\.direct_query|security\.create_uuid)/);
 if(refusal){assert.match(text,/precondition \(false\)/);assert.doesNotMatch(text,/\b(?:db|function|api|ai)\./);}
 const relative=d.file.replace(/^published\//,'');const destination=path.join(out,relative);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes,{flag:'wx'});
 files.push({path:relative,key:d.key,guid:d.guid,sha256:hash(bytes),source_kind:refusal?'local_refusal_candidate':'captured_published'});
}
const manifest={scope:'ISOLATED_AB_ONLY; NOT_APPROVED; NEVER workspace push',parent_workspace:3,source_branch:'v1',records_included:false,environment_values_included:false,agents_tools_tasks_included:false,definitions:files.length,files};
fs.writeFileSync(path.join(out,'source-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({definitions:files.length,manifest_sha256:hash(fs.readFileSync(path.join(out,'source-manifest.json'))),network_requests:0,imports:0}));
