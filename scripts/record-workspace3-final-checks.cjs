'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'backend/reconciliation-20261029/evidence'),capture=process.argv[2];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const command=['scripts/check-workspace3-known-gaps.cjs'];
const r=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8'});
const body=JSON.parse(r.stdout);fs.writeFileSync(path.join(out,'checks/known-gaps-final.json'),JSON.stringify({at:new Date().toISOString(),command:['node',...command],source_sha256:hash(fs.readFileSync(path.join(root,command[0]))),exit:r.status,...body},null,2)+'\n',{flag:'wx'});
const raw=fs.readFileSync(path.join(out,'mutation-refusal-red.tap'));
const text=raw.subarray(0,2).equals(Buffer.from([255,254]))?raw.toString('utf16le').replace(/^\uFEFF/,''):raw.toString();
fs.writeFileSync(path.join(out,'mutation-refusal-red.txt'),text,{flag:'wx'});
fs.writeFileSync(path.join(out,'checks/red-decoding.json'),JSON.stringify({raw_sha256:hash(raw),decoded_sha256:hash(text),transformation:'UTF-16LE PowerShell redirection to UTF-8; original retained',summary:text.split('\n').filter(l=>/tests |pass |fail |✔|✖/.test(l)).slice(0,30)},null,2)+'\n',{flag:'wx'});
if(capture)for(const name of ['discover-meta.cjs','capture-workspace.cjs','index-capture.cjs','capture-datasource.cjs','spec-receipt.json']){
 const to=path.join(out,'capture-tools',name);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(capture,name),to,fs.constants.COPYFILE_EXCL);
}
console.log(JSON.stringify({gap_checks:body.results.length,failed:body.results.filter(x=>x.status==='FAILED').length,exit:r.status,red_summary:text.split('\n').filter(l=>/tests |pass |fail /.test(l))}));
if(r.status!==1)process.exitCode=1;
