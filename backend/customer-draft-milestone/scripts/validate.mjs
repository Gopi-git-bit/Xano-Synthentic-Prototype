import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateXanoscript} from '../../agent-tools-review/node_modules/@xano/developer-mcp/dist/lib.js';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.join(base,'candidate');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const results=[];
for(const file of walk(root).filter(f=>f.endsWith('.xs'))){
  const result=await validateXanoscript({code:fs.readFileSync(file,'utf8')});
  results.push({file:path.relative(root,file).replaceAll('\\','/'),...result});
}
fs.mkdirSync(path.join(base,'.sandbox'),{recursive:true});
fs.writeFileSync(path.join(base,'.sandbox/validation.json'),JSON.stringify({at:new Date().toISOString(),results},null,2));
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.valid).length,failures:results.filter(r=>!r.valid)},null,2));
if(results.some(r=>!r.valid))process.exitCode=1;
