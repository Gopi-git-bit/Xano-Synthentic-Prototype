const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const A=require('../backend/milestone1/reservation-v2/assertions.cjs');
const base=require('../backend/milestone1/assertions.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const uid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function row(code='CREATED') {
 const r={code,http_status:202,order_id:uid(1),trip_id:uid(2),workflow_id:uid(3),correlation_id:uid(4),platform_id:uid(5),trip_assignment_id:uid(6),selected_vehicle_id:uid(7),selected_driver_id:uid(8),order_status:'assigned',order_version:4,table_counts:{...A.EXPECTED},linkage_verified:true,reservation_linkage_verified:true};
 r.reservation_rows=[{reservation_id:uid(9),platform_id:r.platform_id,trip_assignment_id:r.trip_assignment_id,resource_kind:'vehicle',resource_id:r.selected_vehicle_id},{reservation_id:uid(10),platform_id:r.platform_id,trip_assignment_id:r.trip_assignment_id,resource_kind:'driver',resource_id:r.selected_driver_id}];
 return r;
}
function snap(){return {database:'sn9m-aat6-200c',scope:'entire_sandbox_tables',counts:Object.fromEntries(A.TABLES.map(t=>[t,4])),content_hashes:Object.fromEntries(A.TABLES.map(t=>[t,hash('rows:'+t)]))};}
function fault(){const s=snap();return {kind:'application',stage:'after_assignment',error:{requested_fault:'application_after_assignment',source_hash_verified:true,code:'ERROR_INPUT',message:'M1_APPLICATION_AFTER_ASSIGNMENT'},before:{...s.counts},after:{...s.counts},before_snapshot:s,after_snapshot:structuredClone(s),retry:row(),repeated:row('REPLAY')};}
test('all original 15 expected deltas are preserved; exactly two reservation rows added',()=>{assert.equal(A.TABLES.length,16);for(const t of base.TABLES)assert.equal(A.EXPECTED[t],base.EXPECTED[t]);assert.equal(A.EXPECTED.active_assignment_reservations,2);A.complete(row());});
test('15-table-only counts cannot pass revision acceptance',()=>assert.throws(()=>A.counts({...base.EXPECTED})));
test('an incomplete reservation pair cannot pass',()=>{const r=row();r.reservation_rows.pop();assert.throws(()=>A.complete(r));});
for(const [name,mutate] of [
 ['wrong vehicle',r=>r.reservation_rows[0].resource_id=uid(90)],
 ['wrong driver',r=>r.reservation_rows[1].resource_id=uid(90)],
 ['foreign platform',r=>r.reservation_rows[0].platform_id=uid(90)],
 ['foreign assignment',r=>r.reservation_rows[1].trip_assignment_id=uid(90)],
 ['duplicate resource kind',r=>r.reservation_rows[1].resource_kind='vehicle'],
 ['duplicate reservation id',r=>r.reservation_rows[1].reservation_id=r.reservation_rows[0].reservation_id],
 ['linkage flag absent',r=>delete r.reservation_linkage_verified]
]) test(name+' reservation rejected',()=>{const r=row();mutate(r);assert.throws(()=>A.complete(r));});
test('replay preserves both reservation identities',()=>{A.replay(row(),row('REPLAY'));const r=row('REPLAY');r.reservation_rows[0].reservation_id=uid(90);assert.throws(()=>A.replay(row(),r));});
test('full exact rollback with stable replay is accepted as supplied evidence only',()=>A.fault(fault()));
test('counts without content snapshots cannot establish rollback',()=>{const f=fault();delete f.before_snapshot;assert.throws(()=>A.fault(f));});
test('snapshot counts and separately supplied counts must agree',()=>{const f=fault();f.before.orders++;f.after.orders++;assert.throws(()=>A.fault(f));});
for(const table of A.TABLES) test('same-count mutation in '+table+' rejects rollback',()=>{const f=fault();f.after_snapshot.content_hashes[table]=hash('altered');assert.throws(()=>A.fault(f));});
test('a snapshot cannot omit any original or added table',()=>{for(const table of A.TABLES){const s=snap();delete s.content_hashes[table];assert.throws(()=>A.snapshot(s));}});
test('non-sandbox or tenant-only snapshot cannot establish full rollback',()=>{for(const [key,value] of [['database','live'],['scope','two_tenants']]){const s=snap();s[key]=value;assert.throws(()=>A.snapshot(s));}});
test('database failure cannot be relabeled an application failure',()=>{const f=fault();f.error.message='division by zero';assert.throws(()=>A.fault(f));});
test('review hashes and preview payload bind this exact revision, independent of original preview',()=>{
 const m=require('../backend/milestone1/reservation-v2/manifest.json');
 const original=require('../backend/milestone1/manifest.json');
 for(const c of m.candidates){assert.equal(hash(fs.readFileSync(path.join(root,c.path))),c.candidate_sha256);const o=original.candidates.find(x=>x.target_path===c.target_path);assert.equal(hash(fs.readFileSync(path.join(root,o.path))),c.original_candidate_sha256);}
 const p=require('../backend/evidence/milestone1-reservation-v2-preview-2026-10-23.json');
 const payload=[m.schema.path,...m.candidates.map(c=>c.path)].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n---\n');
 assert.equal(hash(payload),p.payload_sha256);assert.equal(m.original_preview_applies,false);
 assert.equal(p.http_status,200);assert.equal(p.imported,false);
});
test('snapshot refuses execution while supported inventory reconciliation is missing',()=>{
 const s=fs.readFileSync(path.join(root,'backend/milestone1/reservation-v2/xano/function/milestone1/snapshot.xs'),'utf8');
 assert.match(s,/precondition \(false\)/);assert.match(s,/SUPPORTED_INVENTORY_RECONCILIATION_REQUIRED/);
 const m=require('../backend/milestone1/reservation-v2/manifest.json');assert.equal(m.activation_enabled,false);
});

