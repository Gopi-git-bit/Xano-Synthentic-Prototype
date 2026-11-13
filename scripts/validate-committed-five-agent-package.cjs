'use strict';
// Validate Git bytes in a new directory; optional LF comparison is explicitly labeled.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync,spawnSync}=require('node:child_process');
const [git,out,mode]=process.argv.slice(2);assert.ok(git&&out,'Supply Git executable and a new extraction directory');
assert.ok(mode===undefined||mode==='--lf-comparison');
const root=path.resolve(__dirname,'..'),commit='ed62038f571c02f339972ad7ec5d7cd1a9cffe18';
assert.ok(!fs.existsSync(out),'Preserve existing results; use a new directory');fs.mkdirSync(out,{recursive:true});
const archive=path.join(out,'committed-package.tar');
const paths=['backend/agent-package','backend/evidence/five-agent-configuration.json','backend/evidence/five-agent-readiness-map.json','backend/xano/ai/agent','scripts/validate-five-agent-config.cjs','scripts/validate-five-agent-schema.py'];
execFileSync(git,['archive','--format=tar','--output='+archive,commit,...paths],{cwd:root});
execFileSync('tar',['-xf',archive,'-C',out]);
const normalized=[];
if(mode==='--lf-comparison'){
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(md|json|xs|cjs|py)$/.test(p)){const b=fs.readFileSync(p),n=Buffer.from(b.toString().replace(/\r\n/g,'\n'));if(!b.equals(n)){normalized.push({file:path.relative(out,p),raw_sha256:hash(b),lf_sha256:hash(n)});fs.writeFileSync(p,n);}}}}
 walk(out);
}
const results=[];
for(const [command,args]of [[process.execPath,['scripts/validate-five-agent-config.cjs']],['python',['scripts/validate-five-agent-schema.py']]]){
 const r=spawnSync(command,args,{cwd:out,encoding:'utf8',timeout:120000});
 results.push({command,args,exit:r.status,stdout:r.stdout,stderr:r.stderr});if(r.status!==0)process.exitCode=1;
}
const suffix=mode?'lf-comparison':'canonical';
const report={at:new Date().toISOString(),source_commit:commit,paths,extraction_directory:out,scope:mode?'LF-normalized comparison only; raw byte-manifest failures remain FAILED':'Canonical Git bytes, offline only; original Windows checkout failures retained',normalized,results};
fs.writeFileSync(path.join(root,'backend/reconciliation-20261029/evidence/checks/five-agent-'+suffix+'.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
const schemaReport=path.join(out,'reports/five-agent-schema-validation.json');
if(fs.existsSync(schemaReport))fs.copyFileSync(schemaReport,path.join(root,'backend/reconciliation-20261029/evidence/checks/five-agent-schema-'+suffix+'.json'),fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify(report,null,2));
