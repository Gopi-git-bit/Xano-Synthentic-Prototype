'use strict';
// Read-only continuation checks. Existing source, runner and approval are inputs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const [profileName,workspace,credentials,cliRoot,sourceRoot,git,outArg]=process.argv.slice(2);
assert.equal(workspace,'3');assert.ok(profileName&&outArg);
const root=path.resolve(__dirname,'..'),out=path.resolve(outArg),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const config=require(path.join(cliRoot,'node_modules/js-yaml')).load(fs.readFileSync(credentials,'utf8')),profile=config.profiles[profileName];
assert.equal(profile.instance_origin,'https://xynd-fnea-khtp.n7e.xano.io');assert.equal(profile.workspace,3);assert.ok(!profile.insecure);
const token=profile.access_token;
function save(name,value){const text=JSON.stringify(value,null,2)+'\n';assert.ok(!text.includes(token));fs.writeFileSync(path.join(out,name),text,{flag:'wx'});}
function run(executable,args,env={}){const started_at=new Date().toISOString();const p=cp.spawnSync(executable,args,{cwd:root,encoding:'utf8',timeout:45000,maxBuffer:4000000,windowsHide:true,env:{...process.env,...env}});const text=(p.stdout||'')+(p.stderr||'');assert.ok(!text.includes(token));return {started_at,exit_code:p.status,output:text,output_sha256:hash(text)};}
async function main(){
 const beforeCredentialHash=hash(fs.readFileSync(credentials)),beforeProfileHash=hash(fs.readFileSync(path.join(root,'profile.yaml')));
 const gitState={head:run(git,['rev-parse','HEAD']),branch:run(git,['branch','--show-current']),ancestor:run(git,['merge-base','--is-ancestor','ea543e9c4679006479144fc6412597b074dd5505','HEAD']),tracked_diff:run(git,['diff','HEAD','--name-only']),worktrees:run(git,['worktree','list','--porcelain'])};
 assert.equal(gitState.head.output.trim(),'61d1b139d27646187f7d4a52bcc6546e11b70a4c');assert.equal(gitState.branch.output.trim(),'codex/xano-m1-reconciliation-20261029');assert.equal(gitState.ancestor.exit_code,0);assert.equal(gitState.tracked_diff.output.trim(),'');
 save('git-preservation.json',gitState);
 const expected='23f6d3bd00c267f481e62bb31506935eda92f4888e909cc6ce16056ef0e20997',manifestPath=path.join(root,'backend/m1-acceptance-preparation/evidence/isolated-source-manifest.json'),bytes=fs.readFileSync(manifestPath),manifest=JSON.parse(bytes);
 assert.equal(hash(bytes),expected);assert.equal(hash(fs.readFileSync(path.join(sourceRoot,'source-manifest.json'))),expected);assert.equal(manifest.files.length,59);
 const files=manifest.files.map(file=>{assert.ok(!file.path.includes('..'));const source=fs.readFileSync(path.join(sourceRoot,file.path));assert.equal(hash(source),file.sha256);assert.ok(source.toString().includes('guid = "'+file.guid+'"'));const original=path.join(root,'backend/reconciliation-20261029',file.source_kind==='local_refusal_candidate'?'candidate':'evidence/published',file.path);assert.equal(hash(fs.readFileSync(original)),file.sha256);return {path:file.path,sha256:file.sha256,status:'VERIFIED'};});
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.relative(sourceRoot,path.join(dir,d.name)).replaceAll('\\','/')]);}
 assert.deepEqual(walk(sourceRoot).sort(),[...manifest.files.map(f=>f.path),'source-manifest.json'].sort());
 save('source-integrity.json',{status:'VERIFIED',manifest_sha256:expected,definitions:59,private_originals_match:true,extra_files:0,files,network_requests:0,imports:0});
 const cli=path.join(cliRoot,'bin/run.js'),common=['-p',profileName,'-w','3','-c',credentials],commands=[['--version'],['ephemeral','create','--help',...common],['ephemeral','push','--help',...common],['ephemeral','list',...common,'-o','json']];
 const results=commands.map(args=>({command:['xano',...args.map(x=>x===credentials?'<existing-private-credentials.yaml>':x)].join(' '),...run(process.execPath,[cli,...args],{XANO_VERBOSE:'false',XANO_CLI_REQUEST_TIMEOUT_MS:'20000'})}));
 for(const result of results)assert.equal(result.exit_code,0,'CLI_CHECK_FAILED');
 const cliFiles=['package.json','dist/base-command.js','dist/commands/ephemeral/create/index.js','dist/commands/ephemeral/push/index.js','dist/commands/ephemeral/list/index.js','dist/utils/multidoc-push.js'];
 save('cli-checks.json',{status:'VERIFIED',results,implementation_hashes:Object.fromEntries(cliFiles.map(f=>[f,hash(fs.readFileSync(path.join(cliRoot,f)))])),credential_file_unchanged:hash(fs.readFileSync(credentials))===beforeCredentialHash,repository_profile_unchanged:hash(fs.readFileSync(path.join(root,'profile.yaml')))===beforeProfileHash,metadata_gets:1,metadata_writes:0,note:'Version/help are local; ephemeral list is the only authenticated CLI network operation. No --verbose. CLI may refresh its version-check cache.'});
 const R=require('../backend/m1-acceptance-preparation/runner.cjs'),template=require('../backend/m1-acceptance-preparation/approval.template.json');
 const plan=run(process.execPath,['backend/m1-acceptance-preparation/runner.cjs','--plan']);assert.equal(plan.exit_code,0);assert.equal(R.plan().stageA.requests,144);assert.equal(R.plan().mutation_routes.length,12);
 let adapterAccesses=0,rejected=false;try{await R.execute(template,new Proxy({},{get(){adapterAccesses++;throw Error('NO_ADAPTER_ALLOWED');}}));}catch(e){rejected=e.code==='APPROVAL_REQUIRED';}assert.ok(rejected);assert.equal(adapterAccesses,0);
 // Negative readiness checks only. These objects never reach execute or a network.
 const now=Date.now(),dummy={...template,status:'APPROVED',approval_ref:'offline-negative-check-not-owner-approval',tenant:'eoffline-only',database_identity:'offline-db',parent_database_identity:'offline-parent',expires_at:new Date(now+4*3600000).toISOString(),credential_expires_at:new Date(now+2*3600000).toISOString(),source_manifest_sha256:expected,adapter_sha256:'a'.repeat(64),fixture_run_id:'offline-negative-check',proof_refs:Object.fromEntries(Object.keys(template.proof_refs).map(k=>[k,'offline:'+k]))};
 function gateRejected(value){try{R.gate(value,now);return false;}catch{return true;}}
 save('acceptance-preparation.json',{scope:'OFFLINE_ONLY',hosted_passes:0,plan,template_rejection:{status:'VERIFIED',code:'APPROVAL_REQUIRED',adapter_accesses:adapterAccesses},additional_readiness_assertions:[{assertion:'gate rejects credential with two hours remaining',status:gateRejected(dummy)?'VERIFIED':'FAILED'},{assertion:'gate rejects source hash other than reviewed allowlist',status:gateRejected({...dummy,credential_expires_at:new Date(now+1800000).toISOString(),source_manifest_sha256:'b'.repeat(64)})?'VERIFIED':'FAILED'}],runner_sha256:hash(fs.readFileSync(path.join(root,'backend/m1-acceptance-preparation/runner.cjs'))),note:'Gate-only counterexamples; no approved readiness file, adapter, login or test records created.'});
 console.log(JSON.stringify({source_definitions:files.length,source_manifest_sha256:expected,cli_checks:results.map(x=>({command:x.command,exit_code:x.exit_code})),template_blocked_before_adapter:rejected,hosted_passes:0}));
}
main().catch(e=>{console.error('READINESS_CHECK_STOPPED '+e.name);process.exitCode=1;});
