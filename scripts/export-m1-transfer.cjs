'use strict';
// Private exact-history export only. No GitHub access, push, merge or Xano call.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const [git,out,scanFile]=process.argv.slice(2);assert.ok(scanFile&&!fs.existsSync(out),'Supply Git, new transfer directory and final scan receipt');
const root=path.resolve(__dirname,'..'),branch='codex/xano-m1-reconciliation-20261029',base='ed62038f571c02f339972ad7ec5d7cd1a9cffe18',review='ea543e9c4679006479144fc6412597b074dd5505';
const run=(args,cwd=root)=>execFileSync(git,args,{cwd,maxBuffer:16e6,stdio:['ignore','pipe','pipe']});
const text=args=>run(args).toString().trim(),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(text(['branch','--show-current']),branch);assert.equal(text(['status','--porcelain']),'');
const tip=text(['rev-parse','HEAD']);run(['merge-base','--is-ancestor',review,tip]);
const scan=JSON.parse(fs.readFileSync(scanFile));assert.equal(scan.commit,tip);assert.equal(scan.scan_status,'PASS_NO_CREDENTIAL_OR_EMAIL_MATCH');
assert.ok(scan.report_links.every(x=>x.valid));
fs.mkdirSync(out,{recursive:true});const bundle=path.resolve(out,'reconciliation.bundle');
run(['bundle','create',bundle,'refs/heads/'+branch,'^'+base]);
// Verify in a separate local bare repo with only the required prerequisite fetched.
const verification=path.resolve(out+'-verification.git');assert.ok(!fs.existsSync(verification));run(['init','--bare','--quiet',verification]);
const vg=args=>run(['--git-dir='+verification,...args]);
vg(['fetch','--quiet','--no-tags',root,base+':refs/heads/prerequisite']);
vg(['bundle','verify',bundle]);vg(['fetch','--quiet',bundle,'refs/heads/'+branch+':refs/heads/imported']);
assert.equal(vg(['rev-parse','refs/heads/imported']).toString().trim(),tip);vg(['fsck','--strict','--no-reflogs',tip]);
const seal=JSON.parse(vg(['show',tip+':backend/reconciliation-20261029/manifest.json']));
for(const f of seal.files)assert.equal(hash(vg(['show',tip+':'+f.path])),f.sha256,f.path);
const blobs=new Map(),commits=[];
function person(line){const m=line.match(/^(.*) <([^>]+)> (\d+) ([+-]\d{4})$/);assert.ok(m);const sign=m[4][0]==='-'?-1:1,offset=sign*(Number(m[4].slice(1,3))*60+Number(m[4].slice(3)));return {name:m[1],email:m[2],date:new Date((Number(m[3])+offset*60)*1000).toISOString().slice(0,-1)+m[4].slice(0,3)+':'+m[4].slice(3),original_timezone:m[4]};}
for(const sha of text(['rev-list','--reverse',base+'..'+tip]).split('\n')){
 const raw=run(['cat-file','commit',sha]),rawText=raw.toString(),boundary=rawText.indexOf('\n\n'),headers=rawText.slice(0,boundary).split('\n');
 const field=k=>headers.find(l=>l.startsWith(k+' ')).slice(k.length+1),parent=field('parent'),tree=field('tree');
 const changes=[];
 for(const p of text(['diff','--name-only',parent,sha]).split('\n').filter(Boolean)){
  const entry=text(['ls-tree',sha,'--',p]).match(/^(\d+) blob ([a-f0-9]{40})\t/);assert.ok(entry,'Only regular-file changes supported');
  const [mode,id]=[entry[1],entry[2]],bytes=run(['cat-file','blob',id]);assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'),id);
  if(!blobs.has(id))blobs.set(id,{sha:id,encoding:'base64',content:bytes.toString('base64')});changes.push({path:p,mode,type:'blob',sha:id});
 }
 commits.push({sha,parent,base_tree:text(['rev-parse',parent+'^{tree}']),tree,message:rawText.slice(boundary+2),author:person(field('author')),committer:person(field('committer')),raw_commit_base64:raw.toString('base64'),changes});
}
const packet={format:'github-git-data-transfer-v1',classification:'PRIVATE_REVIEW_ONLY',repository:'Gopi-git-bit/Xano-Synthentic-Prototype',branch,base,tip,commits,blobs:[...blobs.values()]};
fs.writeFileSync(path.join(out,'git-data.json'),JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
fs.copyFileSync(scanFile,path.join(out,'final-publication-scan.json'));
for(const name of ['CHATGPT_COMPOSIO_HANDOFF.md','XANO_PUBLICATION_REVIEW.md','XANO_ISOLATION_APPROVAL.md','XANO_ACCEPTANCE_EXECUTION.md'])fs.copyFileSync(path.join(root,'docs',name),path.join(out,name));
const files=fs.readdirSync(out).map(name=>{const b=fs.readFileSync(path.join(out,name));return {name,bytes:b.length,sha256:hash(b)};});
const manifest={created_at:new Date().toISOString(),classification:'PRIVATE_REVIEW_ONLY; public release privacy disposition pending',repository:packet.repository,branch,tip,review_commit:review,prerequisite:base,github_publication:'BLOCKED',remote_ref_retry:{attempts:1,result:'CONNECTION_RESET',branch_existence:'UNKNOWN'},verification:{bundle_verified:true,clean_repository_import_tip:tip,git_fsck_exit:0,original_sealed_artifacts_verified:seal.files.length,commit_objects:commits.length,blob_objects:blobs.size},files};
fs.writeFileSync(path.join(out,'transfer-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({tip,branch,bundle:files.find(x=>x.name==='reconciliation.bundle'),verified:true,public_publication:'BLOCKED',manifest_sha256:hash(fs.readFileSync(path.join(out,'transfer-manifest.json')))},null,2));
