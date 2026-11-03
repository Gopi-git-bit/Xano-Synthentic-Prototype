import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateXanoscript, mcpVersion} from '@xano/developer-mcp';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(base, 'candidate');
function files(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
const results = [];
for (const file of files(root).filter(f=>f.endsWith('.xs'))) {
  const result = await validateXanoscript({code:fs.readFileSync(file,'utf8')});
  results.push({file:path.relative(root,file), ...result});
}
const report = {at:new Date().toISOString(), version:await mcpVersion(), results};
fs.mkdirSync(path.join(base,'.sandbox'),{recursive:true});
fs.writeFileSync(path.join(base,'.sandbox/local-validation.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version, checked:results.length, passed:results.filter(r=>r.valid).length, failures:results.filter(r=>!r.valid)},null,2));
if (results.some(r=>!r.valid)) process.exitCode=1;
