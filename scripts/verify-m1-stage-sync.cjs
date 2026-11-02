'use strict';
// Offline receipt verification only. Does not rerun acceptance tests or contact Xano.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const [git,bundleDir,sourceDir,out]=process.argv.slice(2);assert.ok(out);
const root=path.resolve(__dirname,'..'),base='61d1b139d27646187f7d4a52bcc6546e11b70a4c',ancestor='ea543e9c4679006479144fc6412597b074dd5505',receiptRoot='backend/m1-isolated-readiness-20261030';
const read=p=>fs.readFileSync(path.resolve(root,p)),json=p=>JSON.parse(read(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const run=args=>{const r=cp.spawnSync(git,args,{cwd:root,maxBuffer:8000000});assert.equal(r.status,0,'GIT_COMMAND_FAILED');return r.stdout;};
assert.equal(run(['rev-parse','HEAD']).toString().trim(),base);assert.equal(run(['branch','--show-current']).toString().trim(),'codex/xano-m1-reconciliation-20261029');run(['merge-base','--is-ancestor',ancestor,'HEAD']);
const status=run(['status','--porcelain=v1','--untracked-files=all']).toString().trim().split('\n');
const index=json(receiptRoot+'/continuation-hashes.json');
for(const f of index.files){const b=read(f.path);assert.equal(b.length,f.bytes,f.path);assert.equal(hash(b),f.sha256,f.path);}
for(const f of index.temporary_capture_scripts)assert.equal(hash(read(f.path)),f.sha256,f.path);
const seal=json('backend/reconciliation-20261029/manifest.json');
assert.equal(run(['diff',base,'--','backend/reconciliation-20261029','backend/m1-acceptance-preparation/evidence']).length,0);
for(const f of seal.files){const b=read(f.path);assert.equal(b.length,f.bytes,f.path);assert.equal(hash(b),f.sha256,f.path);}
const transfer=JSON.parse(fs.readFileSync(path.join(bundleDir,'transfer-manifest.json')));
assert.equal(transfer.tip,base);assert.equal(transfer.review_commit,ancestor);
for(const f of transfer.files){const b=fs.readFileSync(path.join(bundleDir,f.name));assert.equal(b.length,f.bytes,f.name);assert.equal(hash(b),f.sha256,f.name);}
run(['bundle','verify',path.join(bundleDir,'reconciliation.bundle')]);
const discovery=json(receiptRoot+'/discovery.json');assert.equal(discovery.workspace,3);assert.equal(discovery.source_branch,'v1');assert.equal(discovery.discovery_status,'VERIFIED');assert.equal(discovery.ledger.length,12);
for(const r of discovery.ledger){assert.equal(r.method,'GET');assert.equal(r.status,200);assert.ok(!/impersonate|\/content|\/env(?:\/|\?|$)|\/run/.test(r.route));}
for(const k of ['metadata_writes','record_reads','environment_value_reads','credential_minting','application_requests'])assert.equal(discovery[k],0);
for(const k of ['tenant','database_identity','parent_database_identity'])assert.equal(discovery[k],null);
for(const k of ['tenants','ephemerals']){assert.equal(discovery[k].count,0);assert.equal(discovery[k].nextPage,null);}
for(const name of ['instance-capabilities.json','instance-plan-features.json']){const r=json(receiptRoot+'/'+name);assert.equal(r.http,200);assert.equal(r.method,'GET');assert.equal(r.route,'/api:meta/auth/me');assert.equal(r.package.name,'essential2');}
for(const mode of ['published','draft']){const inv=json(receiptRoot+'/'+mode+'-inventory.json');assert.equal(inv.count,84);assert.equal(inv.documents.length,84);assert.equal(hash(inv.documents.map(d=>d.key+'\t'+d.sha256).join('\n')),inv.inventory_sha256);assert.equal(inv.inventory_sha256,discovery[mode].inventory_sha256);assert.equal(inv.inventory_sha256,json('backend/reconciliation-20261029/evidence/'+mode+'-inventory.json').inventory_sha256);}
assert.equal(json(receiptRoot+'/published-draft-diff.json').changed.length,41);
const cli=json(receiptRoot+'/cli-checks.json');assert.equal(cli.metadata_gets,1);assert.equal(cli.metadata_writes,0);assert.equal(cli.results.length,4);
for(const r of cli.results){assert.equal(r.exit_code,0);assert.equal(hash(r.output),r.output_sha256);}
assert.match(cli.results[0].output,/@xano\/cli\/1\.3\.4/);assert.deepEqual(JSON.parse(cli.results[3].output),{items:[]});assert.ok(cli.credential_file_unchanged&&cli.repository_profile_unchanged);
const sourceManifest='23f6d3bd00c267f481e62bb31506935eda92f4888e909cc6ce16056ef0e20997';
const manifestPath='backend/m1-acceptance-preparation/evidence/isolated-source-manifest.json';assert.equal(hash(read(manifestPath)),sourceManifest);assert.equal(hash(fs.readFileSync(path.join(sourceDir,'source-manifest.json'))),sourceManifest);
const manifest=json(manifestPath);assert.equal(manifest.files.length,59);
for(const f of manifest.files)assert.equal(hash(fs.readFileSync(path.join(sourceDir,f.path))),f.sha256);
const integrity=json(receiptRoot+'/source-integrity.json');assert.equal(integrity.definitions,59);assert.equal(integrity.extra_files,0);assert.equal(integrity.manifest_sha256,sourceManifest);assert.ok(integrity.files.every(f=>f.status==='VERIFIED'));
const tests=json(receiptRoot+'/acceptance-hardening-tests.json');assert.equal(tests.exit_code,0);assert.equal(tests.hosted_passes,0);assert.equal(hash(tests.output),tests.output_sha256);assert.match(tests.output,/# tests 25\n/);assert.match(tests.output,/# pass 25\n/);assert.match(tests.output,/# fail 0\n/);assert.equal(hash(read('backend/m1-acceptance-preparation/runner.cjs')),tests.runner_sha256);assert.equal(hash(read('scripts/test-m1-acceptance-preparation.cjs')),tests.tests_sha256);
const negatives=json(receiptRoot+'/acceptance-preparation.json');assert.equal(negatives.additional_readiness_assertions.length,2);assert.ok(negatives.additional_readiness_assertions.every(r=>r.status==='FAILED'));assert.equal(negatives.hosted_passes,0);assert.equal(hash(run(['show',base+':backend/m1-acceptance-preparation/runner.cjs'])),negatives.runner_sha256);assert.equal(hash(negatives.plan.output),negatives.plan.output_sha256);
const report=read('docs/XANO_M1_ISOLATED_TEST_READINESS.md').toString();let anchors=0;
for(const m of report.matchAll(/\| `([a-z-]+\.json)`(?: \([^\n]*?\))? \| `([a-f0-9]{64})` \|/g)){assert.equal(hash(read(receiptRoot+'/'+m[1])),m[2]);anchors++;}assert.equal(anchors,6);
const result={as_of:new Date().toISOString(),scope:'OFFLINE_VERIFICATION_OF_RETAINED_P0_RECEIPTS',status:'VERIFIED_READ_ONLY',private_baseline:base,review_ancestor:ancestor,branch:'codex/xano-m1-reconciliation-20261029',initial_modified_and_untracked:status,continuation_index_entries_verified:index.files.length,temporary_capture_script_hashes_verified:index.temporary_capture_scripts.length,historical_sealed_artifacts_verified:seal.files.length,historical_seals_modified:false,private_transfer_files_verified:transfer.files.length,bundle_sha256:transfer.files.find(f=>f.name==='reconciliation.bundle').sha256,bundle_verify_exit:0,report_hash_anchors_verified:anchors,source_definitions_verified:59,source_manifest_sha256:sourceManifest,published_inventory_sha256:discovery.published.inventory_sha256,draft_inventory_sha256:discovery.draft.inventory_sha256,published_draft_differences:41,retained_xano_gets:15,retained_direct_http_200:14,retained_cli_list_exit:0,offline_tests:{passed:25,total:25,receipt_verified:true,reexecuted:false},historical_negative_counterexamples:{count:2,status:'FAILED',runner_revision:base,retained:true},p0_effects:{xano_writes:0,tenant_creations:0,preview_imports:0,credential_issuance:0,provider_calls:0,hosted_application_requests:0,hosted_passes:0},current_task_xano_requests:0,stage_p:{verification:'NOT_RUN',approval:'NOT_APPROVED',tenant:null,database_identity:null},public_disclosure:'Raw private report/receipts contain account and machine metadata. Only separately sanitized summary and hash references may be handed off.',qualification:'Independent byte/provenance/ledger verification; no replay and no independent server audit of unrelated activity.'};
fs.mkdirSync(path.dirname(path.resolve(root,out)),{recursive:true});fs.writeFileSync(path.resolve(root,out),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,initial_modified_and_untracked:undefined},null,2));
