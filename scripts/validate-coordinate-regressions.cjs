'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const cases=JSON.parse(fs.readFileSync(path.join(root,'backend/contracts/coordinate-regressions.json'),'utf8'));
const domain=require('../backend/contracts/domain.cjs');
const xs=fs.readFileSync(path.join(root,'backend/xano/function/logistics/validate_order.xs'),'utf8');
const code=xs.match(/code\s*=\s*"""([\s\S]*?)"""/)[1];
const script=new vm.Script('(function(){'+code+'\n})()');
for(const c of cases){
 const actual=domain.validate_order(structuredClone(c.input));
 const exported=JSON.parse(JSON.stringify(script.runInNewContext({$input:{payload:structuredClone(c.input)}},{timeout:1000})));
 for(const [key,value]of Object.entries(c.expected)){
 assert.deepEqual(actual[key],value,c.name+' shared '+key);
 assert.deepEqual(exported[key],value,c.name+' exported '+key);
 }
}
assert.equal(cases.length,84);
console.log('PASS: '+cases.length+' coordinate regressions against shared and exported code.');
