'use strict';
// Re-evaluate the recorded claims only. No remote execution is performed.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../backend/milestone1/assertions.cjs');
const report={scope:'Retained historical evidence evaluation; no fresh Xano execution',ready:false,checks:[]};
for(const [file,kind] of [['backend/evidence/concurrency-result.json','concurrency'],['backend/evidence/rollback-result.json','rollback']]) {
  const bytes=fs.readFileSync(file),raw=JSON.parse(bytes);
  const entry={file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),captured_at:raw.captured_at,original_status:raw.status,checks:[]};
  if(kind==='concurrency') {
    assert.equal(raw.database_verified,'sn9m-aat6-200c');
    for(const c of raw.cases) {
      const codes=c.outcomes.map(o=>o.code);assert.equal(codes.filter(x=>x==='CREATED').length,1);
      const other=c.kind==='competing_keys'?'RESOURCE_BUSY':'REPLAY';assert.equal(codes.filter(x=>x===other).length,3);
      assert.equal(c.outcomes.length,4);assert.equal(c.inspections.length,4);
      assert.equal(new Set(c.outcomes.map(o=>o.db_pid)).size,4);
      for(let i=0;i<4;i++) {
        const inspected=c.inspections[i];assert.equal(inspected.asset_assignments,1);
        const positive=c.kind==='identical_retry'||c.outcomes[i].code==='CREATED';
        assert.equal(inspected.order_count,positive?1:0);assert.equal(inspected.idem_count,positive?1:0);
        if(positive)assert.equal(inspected.complete,true);
      }
      const missing=[];
      for(const field of ['http_status',...A.IDS,'order_status','order_version','table_counts','linkage_verified','started_ms','finished_ms'])if(c.outcomes.some(o=>o[field]===undefined))missing.push(field);
      entry.checks.push({case:c.kind,bounded_recorded_claim:'PASS_REEVALUATED',current_M1_status:'INSUFFICIENT_EVIDENCE',missing_fields:missing,independent_driver_race_present:false});
    }
  } else {
    assert.equal(raw.identity.database,'e9aa-vgbb-7f5c');
    for(const c of raw.cases) {
      assert.equal(c.insert_reached,true);assert.equal(c.caught,true);assert.equal(c.residual_rows,0);assert.equal(c.clean,true);
      entry.checks.push({case:c.failure,bounded_disposable_table_claim:'PASS_REEVALUATED',current_M1_status:'INSUFFICIENT_EVIDENCE',reason:'One disposable proof table; no all-15-table multi-write application-fault snapshot or stable retry IDs.'});
    }
  }
  report.checks.push(entry);
}
fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/milestone1-historical.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({scope:report.scope,recorded_cases_reevaluated:report.checks.reduce((n,c)=>n+c.checks.length,0),bounded_claims:'PASS_REEVALUATED',M1_native_acceptance:'INSUFFICIENT_EVIDENCE',ready:false}));
