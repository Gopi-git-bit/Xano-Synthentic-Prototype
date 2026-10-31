'use strict';
// Offline packaging of the dated GET-only capture. Never reads credential files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const capture=process.argv[2],historical=process.argv[3];assert.ok(capture,'Supply the dated capture directory');
const out=path.resolve(__dirname,'../backend/reconciliation-20261029/evidence');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(capture,p)));
const save=(p,b)=>{fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true});fs.writeFileSync(path.join(out,p),b,{flag:'wx'});};
const json=(p,x)=>save(p,JSON.stringify(x,null,2)+'\n');
const fixed=['published-inventory.json','draft-inventory.json','published-draft-diff.json','published-export.xs','draft-export.xs','published-export.json','draft-export.json','workspace-3.json','workspaces.json','branches.json','data-sources-corrected.json','tenants.json','ephemerals.json','api-groups.json','group-5-openapi.json','group-6-openapi.json','group-7-openapi.json','workflow_test-inventory.json','task-inventory.json','middleware-inventory.json','agent-inventory.json','table-trigger-inventory.json','agent-trigger-inventory.json','capture-ledger.json','read-denials.json','mutation-refusal-red.tap'];
for(const f of fixed)save(f,fs.readFileSync(path.join(capture,f)));
const identity=read('effective-identity.json');delete identity.body.token_metadata.keyid;json('effective-identity.json',identity);
const tables=read('tables.json');json('table-inventory.json',{...tables,body:{...tables.body,items:tables.body.items.map(({id,name,guid,auth,index})=>({id,name,guid,auth,index}))}});
for(const mode of ['published','draft'])for(const d of read(mode+'-inventory.json').documents){
 const b=fs.readFileSync(path.join(capture,d.file));assert.equal(hash(b.toString().trim()),d.sha256);save(d.file,b);
}
if(historical){
 const old=new Map();
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.xs')){const s=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n').trim(),guid=s.match(/\bguid\s*=\s*"([^"]+)"/)?.[1];if(guid)old.set(guid,{file:path.relative(historical,p).replaceAll('\\','/'),sha256:hash(s)});}}}
 walk(historical);
 json('comparison-20261027.json',{historical_root:historical,scope:'Offline normalized source comparison by GUID; no new remote reads',documents:read('published-inventory.json').documents.map(d=>({key:d.key,guid:d.guid,current_sha256:d.sha256,historical:old.get(d.guid)||null,changed:old.has(d.guid)?old.get(d.guid).sha256!==d.sha256:null}))});
}
console.log(JSON.stringify({packaged:true,out,source:'GET-only code/schema capture; no environment values or application records'}));
