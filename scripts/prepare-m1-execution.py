#!/usr/bin/env python3
"""Deterministic, offline-only preparation. Never calls Xano."""
import json, uuid, re, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'backend/milestone1/execution-v3'
X=OUT/'xano/function/m1_execution'
X.mkdir(parents=True,exist_ok=True)
A='87c1d523-8ba6-4e16-849e-0ca819e572ad'
B='809fab1c-e8aa-4b87-af06-9b54bff92048'
RUN='m1x-20261024-prep01'
FIXTURE=['user','accounts','customer_profiles','vendor_profiles','driver_profiles','vehicle_models','vehicles','vehicle_documents','driver_associations','account_role_memberships']
BUSINESS=json.loads((ROOT/'backend/milestone1/reservation-v2/manifest.json').read_text())['write_tables']
def uid(case,label):return str(uuid.uuid5(uuid.NAMESPACE_URL,RUN+'/'+case+'/'+label))
def write(p,s):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
def j(v):return json.dumps(v,separators=(',',':'))
def lit(v):return j(v)
cases=json.loads((ROOT/'backend/milestone1/cases.json').read_text())['cases']
plans={}
for c in cases+[{'id':'proof-vehicle'},{'id':'proof-driver'}]:
 case=c['id']
 if case in ('changed-payload','expired-key'):continue
 p=B if case=='positive-b' else A
 rp=B if case=='identity-foreign_resource' else p
 count=4 if case in ('same-vehicle-race','proof-vehicle','proof-driver') else 2 if case=='same-driver-race' else 1
 u=lambda s:uid(case,s)
 account=u('account');customer=u('customer');vendor=u('vendor');vendor_ac=u('vendor_account');model=u('model')
 rows=[]
 def add(table,**data):rows.append({'table':table,'data':data})
 email=RUN+'-'+case+'@example.invalid'
 if case!='identity-missing_account':
  add('accounts',account_id=account,platform_id=p,external_subject='__ACTOR__',email_normalized=email,status='blocked' if case=='identity-blocked_account' else 'suspended' if case=='identity-suspended_account' else 'active')
 if case=='identity-duplicate_account':
  add('accounts',account_id=u('other_account'),platform_id=B,external_subject='__ACTOR__',email_normalized=email,status='active')
 if case!='identity-missing_customer_profile':
  add('customer_profiles',customer_profile_id=customer,platform_id=p,account_id=account,verification_status='verified')
 if case=='identity-duplicate_customer_profile':
  add('customer_profiles',customer_profile_id=u('duplicate_customer'),platform_id=p,account_id=account,verification_status='verified')
 if case not in ('identity-no_membership','identity-starter_admin_only'):
  for role in ['customer','admin']:
   add('account_role_memberships',membership_id=u('membership_'+role),platform_id=p,account_id=account,role_code=role,valid_from=2051222400000 if case=='identity-future_membership' else 0,valid_until=1577836800000 if case=='identity-expired_membership' else None,correlation_id=u('correlation'))
 add('accounts',account_id=vendor_ac,platform_id=rp,external_subject=RUN+':'+case+':vendor',email_normalized=RUN+'-'+case+'-vendor@example.invalid',status='active')
 add('vendor_profiles',vendor_profile_id=vendor,platform_id=rp,account_id=vendor_ac,eligibility_status='suspended' if case=='identity-inactive_vendor' else 'approved')
 add('vehicle_models',vehicle_model_id=model,platform_id=rp,model_code=RUN+'-'+case,display_name=RUN+' '+case,capacity_kg=1000,body_type='closed',source_version=RUN,approved_by_account_id=account,approved_at=1,active=True)
 assets=[]
 for i in range(count):
  v=u('vehicle'+str(i));d=u('driver'+str(i));da=u('driver_account'+str(i))
  add('accounts',account_id=da,platform_id=rp,external_subject=RUN+':'+case+':driver'+str(i),email_normalized=RUN+'-'+case+'-driver'+str(i)+'@example.invalid',status='active')
  add('driver_profiles',driver_profile_id=d,platform_id=rp,account_id=da,licence_reference=RUN+'-'+case+'-'+str(i),eligibility_status='suspended' if case=='identity-inactive_driver' else 'approved')
  add('account_role_memberships',membership_id=u('driver_membership'+str(i)),platform_id=rp,account_id=da,role_code='driver',valid_from=0,valid_until=None,correlation_id=u('correlation'))
  add('vehicles',vehicle_id=v,platform_id=rp,vendor_profile_id=vendor,vehicle_model_id=model,registration_number=RUN+'-'+case+'-'+str(i),status='approved',approved_by_account_id=account,approved_at=1)
  for typ in ['insurance','fitness']:
   add('vehicle_documents',vehicle_document_id=u(typ+str(i)),platform_id=rp,vehicle_id=v,document_type=typ,object_key=RUN+'/'+case+'/'+typ+str(i),checksum_sha256=hashlib.sha256((RUN+case+typ+str(i)).encode()).hexdigest(),valid_from='2020-01-01',valid_until='2020-01-02' if case=='identity-expired_document' else '2035-01-01',verification_status='pending' if case=='identity-unverified_document' else 'verified')
  add('driver_associations',driver_association_id=u('association'+str(i)),platform_id=rp,driver_profile_id=d,vendor_profile_id=u('foreign_vendor') if case=='identity-foreign_owner' else vendor,valid_from=0,valid_until=None)
  assets.append({'vehicle':v,'driver':d})
 if case=='identity-foreign_owner':
  add('accounts',account_id=u('foreign_vendor_account'),platform_id=p,external_subject=RUN+':'+case+':foreign-vendor',email_normalized=RUN+'-'+case+'-foreign-vendor@example.invalid',status='active')
  add('vendor_profiles',vendor_profile_id=u('foreign_vendor'),platform_id=p,account_id=u('foreign_vendor_account'),eligibility_status='approved')
 # Each proof cohort and each case has disjoint resources. Changes/expiry reuse positive-a.
 n=4 if case in ('same-key-race','same-vehicle-race','proof-vehicle','proof-driver') else 2 if case=='same-driver-race' else 1
 requests=[]
 for i in range(n):
  vi=0 if case in ('same-key-race','same-vehicle-race','proof-vehicle') else i
  di=0 if case in ('same-key-race','same-driver-race','proof-driver') else i
  key=RUN+':'+case+(':'+str(i) if n>1 and case!='same-key-race' else '')
  fault=case.replace('database-','') if case.startswith('database-') else case.replace('application-','application_') if case.startswith('application-') else 'none'
  requests.append({'expected_platform_id':B if case=='identity-foreign_tenant_claim' else p,'vehicle_id':assets[vi]['vehicle'],'driver_profile_id':assets[di]['driver'],'idempotency_key':key,'cargo_description':'Synthetic 61aa324d:'+key,'cargo_weight_kg':1001 if case=='identity-overweight' else 20,'body_type':'open' if case=='identity-wrong_body' else 'closed','fault':fault,'hold_seconds':2 if n>1 else 0})
 plans[case]={'case_id':case,'platform':p,'account':account,'customer':customer,'email':email,'starter_role':'admin' if case=='identity-starter_admin_only' else 'member','rows':rows,'requests':requests,'assets':assets,'seed':case}
for case in ['changed-payload','expired-key']:
 plans[case]={**plans['positive-a'],'case_id':case,'seed':'positive-a'}
 if case=='changed-payload':
  plans[case]={**plans[case],'requests':[{**plans['positive-a']['requests'][0],'cargo_weight_kg':21}]}
write(OUT/'fixtures.json',json.dumps({'run_id':RUN,'fixture_tables':FIXTURE,'cases':plans},indent=2)+'\n')
guard='''    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }
'''
case_input='    enum case_id { values = '+j(list(plans))+' }\n'
context='    function.run "M1Execution/plan" { input = {case_id: $input.case_id} } as $plan\n'
write(X/'plan.xs','// Immutable run-specific plan; no database access.\nfunction "M1Execution/plan" {\n  input {\n'+case_input+'  }\n  stack {\n    var $plans { value = '+j(plans)+' }\n    var $plan { value = $plans|get:$input.case_id }\n  }\n  response = $plan\n  tags = ["m1:execution-preparation"]\n}\n')
# One immutable allowlisted seed plan per case. All writes share one transaction.
seed='// Generated fixed fixtures; native validation pending. No caller-supplied rows.\nfunction "M1Execution/seed" {\n  input {\n'+case_input+'  }\n  stack {\n'+guard+context+'''
    precondition ($plan.seed == $input.case_id) { error = "REUSE_EXISTING_RUN_FIXTURE" }
    db.query user { where = $db.user.email == $plan.email return = {type: "count"} } as $existing
    precondition ($existing == 0) { error = "FIXTURE_ALREADY_EXISTS_DO_NOT_RETRY" }
    var $actor { value = null }
    db.transaction { stack {
      db.add user { data = {name: $plan.email, email: $plan.email, password: null, role: $plan.starter_role} } as $actor
      foreach ($plan.rows) { each as $row {
'''
fields={}
for plan in plans.values():
 for row in plan['rows']:fields.setdefault(row['table'],set()).update(row['data'])
seed+='        var $subject { value = $row.data.external_subject }\n        conditional { if ($subject == "__ACTOR__") { var.update $subject { value = "xano:" ~ $actor.id } } }\n'
for t,keys in fields.items():
 pairs=[k+': '+('$subject' if k=='external_subject' else '$row.data.'+k) for k in sorted(keys)]
 seed+='        conditional { if ($row.table == '+lit(t)+') {\n          db.add '+t+' { data = {'+', '.join(pairs)+'} } as $added\n        } }\n'
seed+='''      } }
    } }
  }
  response = {user_id: $actor.id, case_id: $input.case_id, email: $plan.email, rows: $plan.rows|count}
  tags = ["m1:execution-preparation"]
}
'''
write(X/'seed.xs',seed)
# Read-only generic inspector derived from the reviewed reservation inspector.
src=(ROOT/'backend/milestone1/reservation-v2/xano/function/slice_1/acceptance.xs').read_text()
start=src.index('    db.query orders {',src.index('    conditional {\n      if ($input.action'))
end=src.index('    db.query active_assignment_reservations {',src.index('    var $complete {'))
body=src[start:end]
response=src[src.index('  response = {'):src.index('  tags = ')]
response=re.sub(r'    before_table_counts: \{.*?    http_status', '    http_status',response,flags=re.S)
response=response.replace('    rollback_clean      : $rollback_clean\n','')
prefix='''// Read-only inspection; fixed fixture selection, no command execution.
function "M1Execution/inspect" {
  input {
'''+case_input+'''    int index? filters=min:0|max:3
  }
  stack {
'''+guard+context+'''
    var $request { value = $plan.requests[$input.index] }
    precondition ($request != null) { error = "REQUEST_INDEX_OUTSIDE_PLAN" }
    var $site { value = $plan }
    var $asset { value = {vehicle: $request.vehicle_id} }
    var $driver_asset { value = {driver: $request.driver_profile_id} }
    var $description { value = $request.cargo_description }
    var $outcome { value = {code: "INSPECT"} }
    var $caught { value = false }
'''
body=body.replace('$input.key','$request.idempotency_key')
write(X/'inspect.xs',prefix+body+'  }\n'+response+'  tags = ["m1:execution-preparation"]\n}\n')
# Full snapshots: 16 business tables plus all 10 fixture tables. No raw rows returned.
tables=sorted(set(BUSINESS+FIXTURE))
snap='function "M1Execution/snapshot" {\n  input {}\n  stack {\n'+guard
for t in tables:
 snap+='    db.query '+t+' { sort = {'+t+'.id: "asc"} return = {type: "list"} } as $'+t+'_rows\n'
snap+='  }\n  response = {\n    database: $database.database\n    scope: "entire_sandbox_tables"\n    counts: {'+', '.join(t+': $'+t+'_rows|count' for t in BUSINESS)+'}\n    content_hashes: {'+', '.join(t+': $'+t+'_rows|json_encode|sha256:false' for t in BUSINESS)+'}\n    fixture_counts: {'+', '.join(t+': $'+t+'_rows|count' for t in FIXTURE)+'}\n    fixture_hashes: {'+', '.join(t+': $'+t+'_rows|json_encode|sha256:false' for t in FIXTURE)+'}\n  }\n  tags = ["m1:execution-preparation"]\n}\n'
write(X/'snapshot.xs',snap)
# Read fixture rows back using fixed identity fields, excluding passwords.
check='function "M1Execution/fixture_readback" {\n  input {\n'+case_input+'  }\n  stack {\n'+guard+context+'''
    db.get user { field_name = "email" field_value = $plan.email output = ["id","name","email","role"] } as $actor
    var $observed { value = [] }
    foreach ($plan.rows) { each as $row {
'''
primary={'accounts':'account_id','customer_profiles':'customer_profile_id','vendor_profiles':'vendor_profile_id','driver_profiles':'driver_profile_id','vehicle_models':'vehicle_model_id','vehicles':'vehicle_id','vehicle_documents':'vehicle_document_id','driver_associations':'driver_association_id','account_role_memberships':'membership_id'}
for t,key in primary.items():
 check+='      conditional { if ($row.table == '+lit(t)+') {\n        db.query '+t+' { where = $db.'+t+'.'+key+' == $row.data.'+key+' return = {type: "list"} } as $found\n        array.push $observed { value = {table: '+lit(t)+', rows: $found} }\n      } }\n'
check+='    } }\n  }\n  response = {actor: $actor, observed: $observed}\n  tags = ["m1:execution-preparation"]\n}\n'
write(X/'fixture_readback.xs',check)
# Separate full command path: remove advisory lock; retain unique claims and all business writes.
command=(ROOT/'backend/milestone1/reservation-v2/xano/function/slice_1/create_and_assign.xs').read_text()
proof=command.replace('function "Slice1/create_and_assign"','function "M1Execution/contention_command"')
lock='''        db.direct_query {
          sql = "SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(CAST(? AS text), 0))"
          response_type = "single"
          arg = "slice1:61aa324d:" ~ $identity.platform_id
        } as $locked

'''
assert proof.count(lock)==1
proof=proof.replace(lock,'')
proof=re.sub(r'        db.direct_query \{\n          sql = "SELECT 1 AS held FROM pg_sleep.*?\} as \$held\n','',proof,flags=re.S)
anchor='                // Both unique claims belong to the SAME database transaction.'
instrument='''                db.direct_query {
                  sql = "SELECT pg_backend_pid() AS pid, (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms"
                  response_type = "single"
                } as $claim_entry
                debug.log { value = {marker: "M1_RESERVATION_CLAIM_ENTRY", key: $input.idempotency_key, pid: $claim_entry.pid, ms: $claim_entry.ms} }
                db.direct_query { sql = "SELECT 1 AS barrier FROM pg_sleep(2)" response_type = "single" } as $barrier
'''
proof=proof.replace(anchor,instrument+anchor)
anchor2='                db.add idempotency_records {'
proof=proof.replace(anchor2,'''                // Hold the actual unique tuple locks while contenders attempt both claims.
                db.direct_query { sql = "SELECT 1 AS held FROM pg_sleep(2)" response_type = "single" } as $claim_held
'''+anchor2,1)
proof=re.sub(r'  guid = "[^"]+"\n','',proof)
proof=proof.replace('// RESERVATION V2: preview candidate only; not imported. No release/reuse support.','// EXECUTION V3: separate contention experiment. Not previewed/imported/executed.\n// No advisory lock. Same transactional claims/business writes. No release/reuse support.')
write(X/'contention_command.xs',proof)
# Wrapper catches only AFTER the command's transaction has unwound. $error is retained verbatim.
invoke='function "M1Execution/invoke" {\n  input {\n'+case_input+'    int index? filters=min:0|max:3\n    bool recover?\n  }\n  stack {\n'+guard+context+'''
    var $request { value = $plan.requests[$input.index] }
    precondition ($request != null) { error = "REQUEST_INDEX_OUTSIDE_PLAN" }
    db.get user { field_name = "email" field_value = $plan.email output = ["id"] } as $actor
    precondition ($actor != null) { error = "RUN_FIXTURE_MISSING" }
    var $fault { value = $request.fault }
    conditional { if ($input.recover) { var.update $fault { value = "none" } } }
    var $outcome { value = null }
    try_catch { try {
      conditional {
        if ($input.case_id == "proof-vehicle" || $input.case_id == "proof-driver") {
          function.run "M1Execution/contention_command" { input = $request|set:"user_id":$actor.id|set:"fault":$fault } as $outcome
        } else {
          function.run "Slice1/create_and_assign" { input = $request|set:"user_id":$actor.id|set:"fault":$fault } as $outcome
        }
      }
    } catch {
      var.update $outcome { value = {code: "NATIVE_FAILURE", native_error: $error, requested_fault: $fault} }
    } }
  }
  response = $outcome
  tags = ["m1:execution-preparation"]
}
'''
write(X/'invoke.xs',invoke)
# Exactly one permitted update: run-owned positive-a expiry. No supplied ID/key/time.
pa=plans['positive-a']
expiry='function "M1Execution/expire_positive_a" {\n  input {}\n  stack {\n'+guard+'''
    db.get accounts { field_name = "account_id" field_value = '''+lit(pa['account'])+''' } as $account
    precondition ($account != null && $account.email_normalized == '''+lit(pa['email'])+''') { error = "RUN_OWNERSHIP_REQUIRED" }
    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == '''+lit(A)+''' && $db.idempotency_records.operation_scope == '''+lit('slice1:create_assign:'+pa['account'])+''' && $db.idempotency_records.idempotency_key == '''+lit(pa['requests'][0]['idempotency_key'])+'''
      return = {type: "list"}
    } as $matches
    precondition (($matches|count) == 1) { error = "ONE_OWNED_IDEMPOTENCY_RECORD_REQUIRED" }
    var $record { value = $matches|first }
    precondition ($record.status == "succeeded" && $record.expires_at > now) { error = "UNEXPIRED_SUCCESS_REQUIRED" }
    db.edit idempotency_records { field_name = "id" field_value = $record.id data = {expires_at: 1} } as $expired
  }
  response = {id: $expired.id, expires_at: $expired.expires_at, response_reference: $expired.response_reference}
  tags = ["m1:execution-preparation"]
}
'''
write(X/'expire_positive_a.xs',expiry)
print('Generated fixed fixtures for',len(plans),'cases/cohorts and',len(list(X.glob('*.xs'))),'native helpers; no network calls.')

# Catalog evidence uses read-only PostgreSQL system catalogs; no DDL or advisory locks.
catalog='''function "M1Execution/catalog" {
  input {}
  stack {
'''+guard+'''
    db.direct_query {
      sql = """
        SELECT json_build_object(
          'database',current_database(),
          'tables',(SELECT json_agg(c.relname ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'mvpw1_%'),
          'indexes',(SELECT json_agg(x) FROM (
            SELECT c.relname AS tablename,ic.relname AS indexname,i.indisunique,i.indisvalid,i.indisready,
              pg_get_expr(i.indpred,i.indrelid) AS predicate,
              ARRAY(SELECT a.attname FROM unnest(i.indkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum ORDER BY k.ord) AS columns,
              ARRAY(SELECT a.attnotnull FROM unnest(i.indkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum ORDER BY k.ord) AS not_null,
              pg_get_indexdef(i.indexrelid) AS definition
            FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_class ic ON ic.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relname LIKE 'mvpw1_%' ORDER BY c.relname,ic.relname
          ) x)
        ) AS evidence
      """
      response_type = "single"
    } as $catalog
  }
  response = $catalog.evidence
  tags = ["m1:execution-preparation","read-only"]
}
'''
write(X/'catalog.xs',catalog)
# Digest every full row, preserving existing contents while revealing no row payload.
snap=(X/'snapshot.xs').read_text()
marker='  }\n  response = {'
rowstack=''
for t in tables:
 rowstack+='    var $'+t+'_digests { value = [] }\n    foreach ($'+t+'_rows) { each as $row {\n      array.push $'+t+'_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }\n    } }\n'
snap=snap.replace(marker,rowstack+marker,1)
snap=snap.replace('    fixture_counts:', '    row_digests: {'+', '.join(t+': $'+t+'_digests' for t in tables)+'}\n    fixture_counts:',1)
write(X/'snapshot.xs',snap)
proof=(X/'contention_command.xs').read_text().replace('                // Hold the actual unique tuple locks', '''                db.direct_query { sql = "SELECT pg_backend_pid() AS pid, (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms" response_type = "single" } as $claimed
                debug.log { value = {marker: "M1_RESERVATION_CLAIMS_ACQUIRED", key: $input.idempotency_key, pid: $claimed.pid, ms: $claimed.ms} }
                // Hold the actual unique tuple locks''')
write(X/'contention_command.xs',proof)

seed=(X/'seed.xs').read_text().replace('    db.transaction { stack {','    var $outcome { value = {code: "SEEDED"} }\n    try_catch { try {\n    db.transaction { stack {',1)
seed=seed.replace('  }\n  response = {user_id:', '''    } catch { var.update $outcome { value = {code: "NATIVE_FAILURE", native_error: $error} } } }
  }
  response = $outcome|set:"user_id":$actor.id|set:"case_id":$input.case_id|set:"email":$plan.email|set:"rows":($plan.rows|count)
//  response = {user_id:''',1)
write(X/'seed.xs',seed)

snap=(X/'snapshot.xs').read_text()
for t in tables:
 anchor='    var $'+t+'_digests'
 check='    db.query '+t+' { return = {type: "count"} } as $'+t+'_total\n    precondition (($'+t+'_rows|count) == $'+t+'_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:'+t+'" }\n'
 snap=snap.replace(anchor,check+anchor,1)
write(X/'snapshot.xs',snap)

proof=(X/'contention_command.xs').read_text()
proof=proof.replace('  }\n\n  response = $result','    db.direct_query { sql = "SELECT (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms" response_type = "single" } as $proof_finished\n  }\n\n  response = $result\n    |set:"transaction_finished_ms":$proof_finished.ms',1)
write(X/'contention_command.xs',proof)
waits='''// Read-only observer: never returns SQL text, payloads or credentials.
function "M1Execution/contention_waits" {
  input {}
  stack {
'''+guard+'''
    db.direct_query {
      sql = """
        SELECT json_build_object('database',current_database(),
          'ms',(extract(epoch FROM clock_timestamp()) * 1000)::bigint,
          'waits',(SELECT coalesce(json_agg(x),'[]'::json) FROM (
            SELECT pid,wait_event_type,wait_event,pg_blocking_pids(pid) AS blocking_pids
            FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'
            ORDER BY pid
          ) x)) AS evidence
      """
      response_type = "single"
    } as $observed
  }
  response = $observed.evidence
  tags = ["m1:execution-preparation","read-only"]
}
'''
write(X/'contention_waits.xs',waits)

seed=(X/"seed.xs").read_text()
seed="\n".join(line for line in seed.splitlines() if not line.startswith("//  response ="))+"\n"
write(X/"seed.xs",seed)
