'use strict';
// Evaluates supplied evidence. It never executes Xano or infers hosted acceptance.
const assert = require('node:assert/strict');
const EXPECTED = Object.freeze({
  active_assignment_reservations:2, idempotency_records:1, quotes:1, orders:1, order_stops:2,
  dispatch_requirements:1, transaction_participants:2, service_commitments:1,
  dispatch_offers:1, trips:1, trip_assignments:1, order_state_transitions:3,
  operational_events:4, audit_events:1, durable_tasks:1, event_outbox:1
});
const TABLES = Object.freeze(Object.keys(EXPECTED).sort());
const IDS = ['order_id','trip_id','workflow_id','correlation_id'];
function counts(value) {
  assert.ok(value && typeof value === 'object', 'Table counts required');
  assert.deepEqual(Object.keys(value).sort(), TABLES, 'All 16 table counts required');
  for (const table of TABLES) assert.ok(Number.isSafeInteger(value[table]) && value[table] >= 0, 'Invalid count: '+table);
  return value;
}
function unchanged(before, after) {
  counts(before); counts(after);
  for (const table of TABLES) assert.equal(after[table], before[table], 'Unexpected residue: '+table);
}
function complete(row) {
  assert.ok(['CREATED','REPLAY','INSPECT'].includes(row.code));
  assert.equal(row.http_status, 202);
  for (const id of IDS) assert.match(row[id] || '', /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, 'Stable '+id+' required');
  assert.equal(row.order_status,'assigned'); assert.equal(row.order_version,4);
  assert.deepEqual(counts(row.table_counts), EXPECTED, 'Incomplete persisted transaction');
  assert.equal(row.linkage_verified,true, 'Tenant/order/correlation linkage must be inspected separately');
  reservationLinkage(row);
}
function reservationLinkage(row) {
  assert.equal(row.reservation_linkage_verified,true);
  for(const key of ['platform_id','trip_assignment_id','selected_vehicle_id','selected_driver_id'])
    assert.match(row[key]||'',/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,key);
  assert.equal(row.reservation_rows?.length,2);
  assert.equal(new Set(row.reservation_rows.map(r=>r.reservation_id)).size,2);
  for(const [kind,field] of [['vehicle','selected_vehicle_id'],['driver','selected_driver_id']]) {
    const matching=row.reservation_rows.filter(r=>r.resource_kind===kind);
    assert.equal(matching.length,1);
    const r=matching[0];
    assert.match(r.reservation_id||'',/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    assert.equal(r.platform_id,row.platform_id); assert.equal(r.trip_assignment_id,row.trip_assignment_id);
    assert.equal(r.resource_id,row[field]);
  }
}
function snapshot(value) {
  assert.equal(value?.database,'sn9m-aat6-200c');
  assert.equal(value.scope,'entire_sandbox_tables');
  counts(value.counts);
  assert.deepEqual(Object.keys(value.content_hashes||{}).sort(),TABLES);
  for(const t of TABLES) assert.match(value.content_hashes[t],/^[a-f0-9]{64}$/);
  return value;
}
function unchangedSnapshot(before,after) {
  snapshot(before); snapshot(after); unchanged(before.counts,after.counts);
  assert.deepEqual(after.content_hashes,before.content_hashes,'Same-count content mutation detected');
}
function replay(created, repeated) {
  complete(created); complete(repeated);
  assert.equal(created.code,'CREATED'); assert.equal(repeated.code,'REPLAY');
  for (const id of [...IDS,'trip_assignment_id']) assert.equal(repeated[id], created[id], 'Replay changed '+id);
  const canonical=rows=>rows.map(r=>({reservation_id:r.reservation_id,platform_id:r.platform_id,resource_kind:r.resource_kind,resource_id:r.resource_id,trip_assignment_id:r.trip_assignment_id})).sort((a,b)=>a.resource_kind.localeCompare(b.resource_kind));
  assert.deepEqual(canonical(repeated.reservation_rows),canonical(created.reservation_rows),'Replay changed reservation identity');
  unchanged(created.table_counts,repeated.table_counts);
}
function rejected(row, before, after, code) {
  assert.ok(typeof code==='string' && code.length>0 && !['CREATED','REPLAY','INSPECT'].includes(code),'Explicit rejection code required');
  assert.equal(row.code,code); unchanged(before,after);
  if (code === 'IDEMPOTENCY_CONFLICT') assert.equal(row.http_status,409);
}
function race({kind, requests, outcomes, inspections, active_vehicle_assignments, active_driver_assignments}) {
  assert.ok(['same_key','same_vehicle','same_driver'].includes(kind));
  const size = kind === 'same_driver' ? 2 : 4;
  assert.equal(requests.length,size); assert.equal(outcomes.length,size); assert.equal(inspections.length,size);
  for(const r of requests) for(const field of ['platform_id','vehicle_id','driver_profile_id','key']) assert.ok(typeof r[field]==='string' && r[field].length>0,'Race identity required: '+field);
  assert.equal(new Set(requests.map(r=>r.platform_id)).size,1,'Race must share a tenant');
  assert.equal(outcomes.filter(r=>r.code==='CREATED').length,1);
  const other = kind === 'same_key' ? 'REPLAY' : 'RESOURCE_BUSY';
  assert.equal(outcomes.filter(r=>r.code===other).length,size-1);
  assert.ok(new Set(outcomes.map(r=>r.db_pid)).size>=2,'Distinct database sessions required');
  for(const o of outcomes) {
    assert.ok(Number.isSafeInteger(o.db_pid) && o.db_pid>0);
    assert.ok(Number.isFinite(o.lock_started_ms) && Number.isFinite(o.lock_acquired_ms) && o.lock_acquired_ms>=o.lock_started_ms);
  }
  for(const o of outcomes) assert.ok(Number.isFinite(o.started_ms) && Number.isFinite(o.finished_ms) && o.finished_ms>o.started_ms);
  assert.ok(Math.max(...outcomes.map(o=>o.started_ms)) < Math.min(...outcomes.map(o=>o.finished_ms)), 'Sequential requests are not a race');
  assert.ok(outcomes.some(o=>o.lock_wait_ms>=1500), 'Observed lock contention required');
  assert.equal(active_driver_assignments,1);
  if(kind==='same_driver') {
    assert.equal(new Set(requests.map(r=>r.vehicle_id)).size,size,'Driver-only race needs distinct vehicles');
    assert.equal(new Set(requests.map(r=>r.driver_profile_id)).size,1,'Driver-only race must share the driver');
  } else {
    assert.equal(new Set(requests.map(r=>r.vehicle_id)).size,1);
    assert.equal(active_vehicle_assignments,1);
  }
  if(kind==='same_key') {
    for(const r of requests) assert.match(r.request_hash || '',/^[a-f0-9]{64}$/,'Recorded request hash required');
    assert.equal(new Set(requests.map(r=>r.key)).size,1);
    assert.equal(new Set(requests.map(r=>r.request_hash)).size,1);
    const winner=outcomes.find(o=>o.code==='CREATED');
    complete(winner);
    for(let i=0;i<size;i++) {complete(outcomes[i]); complete(inspections[i]); for(const id of IDS) {assert.equal(outcomes[i][id],winner[id]);assert.equal(inspections[i][id],winner[id]);}}
  } else {
    assert.equal(new Set(requests.map(r=>r.key)).size,size);
    for(let i=0;i<size;i++) {
      if(outcomes[i].code==='CREATED') complete(inspections[i]);
      else {assert.equal(outcomes[i].http_status,409);assert.deepEqual(counts(inspections[i].table_counts),Object.fromEntries(TABLES.map(t=>[t,0])), 'Losing command left records');}
    }
  }
}
function fault({kind, stage, error, before, after, before_snapshot, after_snapshot, retry, repeated}) {
  assert.ok(['database','application'].includes(kind));
  assert.ok(['after_order','after_assignment'].includes(stage));
  assert.equal(error.requested_fault,kind==='database'?stage:'application_'+stage);
  assert.equal(error.source_hash_verified,true,'Native function source must match the reviewed candidate');
  assert.ok(typeof error.code==='string' && error.code.length>0,'Native failure code required');
  assert.match(error.message || '',kind==='database'?/division by zero/i:new RegExp('M1_APPLICATION_'+stage.toUpperCase()));
  assert.ok(!['CREATED','REPLAY'].includes(error.code),'Fault must actually fail');
  unchanged(before,after); unchangedSnapshot(before_snapshot,after_snapshot);
  assert.deepEqual(before,before_snapshot.counts); assert.deepEqual(after,after_snapshot.counts);
  replay(retry,repeated);
}
module.exports={EXPECTED,TABLES,IDS,counts,unchanged,complete,replay,rejected,race,fault,reservationLinkage,snapshot,unchangedSnapshot};
