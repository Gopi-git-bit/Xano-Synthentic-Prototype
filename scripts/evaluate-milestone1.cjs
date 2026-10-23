'use strict';
const fs=require('node:fs'),path=require('node:path');
const checks=require('../backend/milestone1/assertions.cjs');
function evaluate(input) {
  const results=[];
  for(const item of input.cases) {
    if(item.status==='NOT_RUN') {results.push({id:item.id,status:'NOT_RUN'});continue;}
    if(item.execution_scope!=='xano_native' || !item.evidence_ref) {results.push({id:item.id,status:'REJECTED_EVIDENCE',reason:'Hosted execution provenance required'});continue;}
    try {
      if(!['complete','replay','rejected','race','fault'].includes(item.assertion)) throw Error('Unknown assertion');
      const args=Array.isArray(item.arguments)?item.arguments:[item.arguments];
      checks[item.assertion](...args);
      results.push({id:item.id,status:'ASSERTIONS_PASS_REVIEW_REQUIRED',evidence_ref:item.evidence_ref});
    } catch(error) {results.push({id:item.id,status:'FAIL',reason:error.message});}
  }
  return {scope:'Evidence evaluation only; does not authenticate or execute Xano',ready:false,results};
}
module.exports={evaluate};
if(require.main===module) {
  const source=process.argv[2]||path.join(__dirname,'../backend/milestone1/cases.json');
  const result=evaluate(JSON.parse(fs.readFileSync(source,'utf8')));
  fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/milestone1-evaluation.json',JSON.stringify(result,null,2)+'\n');
  const totals={};for(const r of result.results)totals[r.status]=(totals[r.status]||0)+1;
  console.log(JSON.stringify({scope:result.scope,ready:false,totals}));
  if(result.results.some(r=>['FAIL','REJECTED_EVIDENCE'].includes(r.status)))process.exitCode=1;
}
