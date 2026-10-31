'use strict';
// Offline audit of exact outgoing Git blobs. Findings never contain matched values.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {parseEnv}=require('node:util');
const [git,credentials,yamlModule,providerEnv,out,requestedCommit]=process.argv.slice(2);
assert.ok(out,'Usage: node scripts/review-m1-publication.cjs <git> <credentials.yaml> <js-yaml-module> <private-provider.env> <new-report.json>');
const base='ed62038f571c02f339972ad7ec5d7cd1a9cffe18';
const run=args=>execFileSync(git,args,{maxBuffer:8e6});
const commit=run(['rev-parse',requestedCommit||'ea543e9c4679006479144fc6412597b074dd5505']).toString().trim();
run(['merge-base','--is-ancestor',base,commit]);
assert.equal(run(['diff','--name-only','--diff-filter=MDR',base,commit]).toString().trim(),'');
const names=run(['diff','--name-only','-z',base,commit]).toString().split('\0').filter(Boolean);if(!requestedCommit)assert.equal(names.length,246);
const config=require(path.resolve(yamlModule)).load(fs.readFileSync(credentials,'utf8'));
const privateValues=[...Object.values(config.profiles).filter(p=>p.access_token).map(p=>({name:'configured_metadata_credential',value:p.access_token})),...Object.entries(parseEnv(fs.readFileSync(providerEnv,'utf8'))).filter(([,v])=>v.length>=12).map(([name,value])=>({name:'private_env:'+name,value}))];
const findings=[],files=[],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of names){
 const b=run(['show',commit+':'+name]);files.push({path:name,bytes:b.length,sha256:hash(b)});
 const text=b.subarray(0,2).equals(Buffer.from([255,254]))?b.toString('utf16le'):b.toString('utf8');
 function found(category,pattern){const hits=[...text.matchAll(pattern)];if(hits.length)findings.push({path:name,category,count:hits.length,lines:hits.slice(0,15).map(m=>text.slice(0,m.index).split('\n').length)});}
 for(const {name:key,value}of privateValues)if(text.includes(value))findings.push({path:name,category:'known_private_value',key,count:text.split(value).length-1});
 found('credential_pattern',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g);
 found('literal_sensitive_value',/\b(?:access_token|api_key|client_secret|password)\s*[:=]\s*["'][^"'\s]{12,}["']/gi);
 found('absolute_windows_path',/[A-Z]:[\\/]+(?:Users|Program Files)[^\r\n"']*/gi);
 found('non_example_email',/\b[A-Z0-9._%+-]+@(?!example\.(?:com|org|net)\b|[^\s@]*\.example\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
 found('credential_query_parameter',/[?&](?:token|access_token|key|_ti|magic_token)=[A-Za-z0-9_-]{12,}/gi);
}
const reports=names.filter(p=>/^docs\/XANO_/.test(p)),links=[];
for(const name of reports){const text=run(['show',commit+':'+name]).toString();for(const m of text.matchAll(/\]\(([^)]+)\)/g)){if(/^(https?:|#)/.test(m[1]))continue;const target=path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1].split('#')[0]));let valid=true;try{run(['cat-file','-e',commit+':'+target]);}catch{valid=false;}links.push({from:name,target,valid});}}
const hard=findings.filter(f=>!['absolute_windows_path'].includes(f.category));
const report={at:new Date().toISOString(),commit,review_base:base,parent:run(['rev-parse',commit+'^']).toString().trim(),added_files:names.length,original_tracked_files_preserved:true,scope:'Exact added blobs; known configured metadata/provider values, common credential patterns, email/path PII, link targets. Manual response/schema review also required.',scan_status:hard.length?'REVIEW_REQUIRED':'PASS_NO_CREDENTIAL_OR_EMAIL_MATCH',findings,report_links:links,files};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({added_files:names.length,known_secret_matches:findings.filter(f=>f.category==='known_private_value').length,findings:findings.map(({path,category,count})=>({path,category,count})),links_valid:links.every(x=>x.valid)},null,2));
