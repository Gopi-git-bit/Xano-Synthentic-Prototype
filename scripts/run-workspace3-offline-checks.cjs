'use strict';
// Executes only explicit local validators/mock tests. No hosted runner is called.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'backend/reconciliation-20261029/evidence/checks');
const frontend=process.argv[2];if(!frontend)throw Error('Supply inspected frontend/ directory');
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[
 ['mutation-refusal-green',process.execPath,['--test','--test-reporter=tap','scripts/test-workspace3-mutation-refusal.cjs'],root,0],
 ['known-gaps-red',process.execPath,['scripts/check-workspace3-known-gaps.cjs'],root,1],
 ['frontend-contracts',process.execPath,['--test','--test-reporter=tap','server/gateway.test.mjs','server/xano.test.mjs'],frontend,0],
 ['five-agent-config',process.execPath,['scripts/validate-five-agent-config.cjs'],root,0],
 ['five-agent-schema','python',['scripts/validate-five-agent-schema.py'],root,0],
 ['m1-execution-model',process.execPath,['--test','--test-reporter=tap','scripts/test-m1-execution.cjs'],root,0]
];
const results=[];
for(const [name,command,args,cwd,expectedExit]of checks){
 const start=new Date().toISOString(),r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:120000,env:{...process.env,W3_TEST_PUBLISHED:'0',W3_CAPTURE_ROOT:path.join(root,'backend/reconciliation-20261029/evidence')}});
 const text=(r.stdout||'')+(r.stderr||'');fs.writeFileSync(path.join(out,name+'.txt'),text,{flag:'wx'});
 const inputs=args.filter(a=>fs.existsSync(path.resolve(cwd,a))&&fs.statSync(path.resolve(cwd,a)).isFile()).map(file=>({file,sha256:hash(fs.readFileSync(path.resolve(cwd,file)))}));
 const result={name,command,args,cwd,start,finished_at:new Date().toISOString(),exit:r.status,expected_exit:expectedExit,expected_result:r.status===expectedExit,output_sha256:hash(text),inputs,summary:text.split('\n').filter(l=>/^# (tests|pass|fail|skipped) |^PASS:|^\{"schema_meta/.test(l))};results.push(result);console.log(JSON.stringify(result));
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({node:process.version,platform:process.platform,scope:'Offline only. Known-gap assertions deliberately fail; models and schema checks are not Xano passes.',results},null,2)+'\n',{flag:'wx'});
if(results.some(x=>!x.expected_result))process.exitCode=1;
