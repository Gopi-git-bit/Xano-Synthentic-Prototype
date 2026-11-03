'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>!['node_modules','.sandbox','target.local.json'].includes(e.name)).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const patterns=[/gh[pousr]_[A-Za-z0-9]{25,}/,/github_pat_[A-Za-z0-9_]+/,/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/];
const files=walk(root);
for(const file of files){
  if(file===__filename)continue;
  const text=fs.readFileSync(file,'utf8');
  assert.ok(!/C:[\\/]Users[\\/]|xynd-fnea-khtp|pofBqnrY/.test(text),'Machine/production setting in '+path.relative(root,file));
  for(const pattern of patterns)assert.ok(!pattern.test(text),'Possible secret in '+path.relative(root,file));
}
console.log(JSON.stringify({reviewed_files:files.length,publication_scan:'passed'}));
