'use strict';
// Local preservation/provenance audit. Credentials are compared in memory only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const [git,frontend]=process.argv.slice(2);assert.ok(git&&frontend,'Supply Git executable and inspected frontend worktree');
const root=path.resolve(__dirname,'..'),base='ed62038f571c02f339972ad7ec5d7cd1a9cffe18';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const run=(args,cwd=root)=>execFileSync(git,args,{cwd,encoding:'utf8'}).trim();
assert.equal(run(['rev-parse','HEAD']),base);assert.equal(run(['branch','--show-current']),'codex/xano-m1-reconciliation-20261029');
const frontendHead=run(['rev-parse','HEAD'],frontend);assert.equal(frontendHead,'35461bd62bfd90b6f7e901791aa3d097b6649ead');assert.equal(run(['status','--porcelain'],frontend),'');
assert.equal(run(['diff','--name-only',base]),'','Existing tracked files changed before staging');
const fpaths=['docs/XANO.md','docs/FRONTEND-PLAN.md','docs/API.md','docs/DELIVERY.md','server/gateway.mjs','server/bookings.mjs','server/xano.test.mjs','tests/booking-reader.spec.ts'];
const frontendFiles=fpaths.map(p=>({path:'frontend/'+p,sha256:hash(fs.readFileSync(path.join(frontend,'frontend',p)))}));
const yaml=require('C:/Users/ashok/AppData/Roaming/npm/node_modules/@xano/cli/node_modules/js-yaml');
const config=yaml.load(fs.readFileSync('C:/Users/ashok/.xano/credentials.yaml','utf8'));
const tokens=Object.values(config.profiles).map(p=>p.access_token).filter(Boolean);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const docs=['XANO_CURRENT_STATE.md','XANO_M1_RECONCILIATION.md','XANO_BACKEND_TEST_EVIDENCE.md','XANO_FRONTEND_INTEGRATION_HANDOFF.md'].map(p=>path.join(root,'docs',p));
const scripts=fs.readdirSync(path.join(root,'scripts')).filter(p=>p.includes('workspace3')||p==='validate-committed-five-agent-package.cjs').map(p=>path.join(root,'scripts',p));
const files=[...walk(path.join(root,'backend/reconciliation-20261029')),...docs,...scripts];
for(const p of files){const b=fs.readFileSync(p);for(const token of tokens)for(const encoding of ['utf8','utf16le'])assert.ok(!b.includes(Buffer.from(token,encoding)),'Configured credential found in review artifact');}
for(const p of docs){const text=fs.readFileSync(p,'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){if(/^(https?:|#)/.test(m[1]))continue;assert.ok(fs.existsSync(path.resolve(path.dirname(p),m[1].split('#')[0])),'Broken report link');}}
const report={at:new Date().toISOString(),base_git_commit:base,review_branch:run(['branch','--show-current']),frontend_commit:frontendHead,frontend_clean:true,existing_backend_tracked_diff:[],frontend_files:frontendFiles,configured_metadata_secret_scan:{files:files.length,matches:0,values_disclosed:0},report_links:'VERIFIED',reports:docs.map(p=>({path:path.relative(root,p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))})),deployment_actions:0};
fs.writeFileSync(path.join(root,'backend/reconciliation-20261029/evidence/review-provenance.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({frontend_clean:true,existing_backend_preserved:true,scanned_files:files.length,credential_matches:0,report_links:'VERIFIED'}));
