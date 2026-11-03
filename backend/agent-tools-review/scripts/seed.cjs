'use strict';
const c=require('./tenant-lib.cjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
async function main(){
  await c.verify();
  assert.ok(!fs.existsSync(c.output+'/fixtures.json'),'Synthetic fixtures already exist.');
  const tables=Object.fromEntries((await c.list('table')).map(t=>[t.name,t.id]));
  for(const name of ['user','organization','customer_booking']){
    const rows=await c.ok('/table/'+tables[name]+'/content?per_page=100');
    assert.equal((rows.items||rows).length,0,'Expected empty isolated '+name);
  }
  const now=Date.now(),day=86400000,start=now+day,end=now+2*day;
  const date=n=>new Date(n).toISOString().slice(0,10);
  const fixtures={at:new Date().toISOString(),tenant:c.tenant,tables,users:{},organizations:{},bookings:{},vehicles:{},drivers:{},payments:{},pods:{},quotes:{}};
  async function add(name,data){
    const row=await c.ok('/table/'+tables[name]+'/content','POST',data);
    assert.ok(Number.isInteger(row.id),name+' did not return a record ID');
    return row.id;
  }
  for(const [key,type]of [['a','customer'],['b','customer'],['carrier','vendor'],['competitor','vendor']]){
    fixtures.organizations[key]=await add('organization',{name:'SYNTHETIC ZIPPY 20261103 '+key,type,status:'active',kyb_verified:true,tax_id:'SYNTH-20261103-'+key});
  }
  const userDefs={
    alice:['customer_admin','a','owner',true],bob:['customer_admin','b','owner',true],
    member:['customer_member','a','member',true],operator:['operations_admin',null,null,true],
    vendor:['vendor_admin','carrier','owner',true],driver:['driver','carrier','driver',true],
    other_driver:['driver','competitor','driver',true],bad_driver:['driver','carrier','driver',true],
    suspended:['customer_admin','a','owner',true],unverified:['customer_admin','a','owner',true],
    inactive_member:['customer_admin','a','owner',false]
  };
  for(const [key,[system_role,org,member_role,is_active]]of Object.entries(userDefs)){
    const email='synthetic-zippy-'+key+'@example.invalid';
    const id=await add('user',{name:'SYNTHETIC '+key,email,role:'member',system_role,status:'active',active_organization_id:org?fixtures.organizations[org]:null});
    fixtures.users[key]={id,email};
    if(org)await add('organization_member',{organization_id:fixtures.organizations[org],user_id:id,member_role,is_active,is_primary:true});
  }
  for(const [key,org,user]of [['good','carrier','driver'],['foreign','competitor','other_driver'],['bad','carrier','bad_driver']]){
    const driver_id=await add('driver_profile',{user_id:fixtures.users[user].id,organization_id:fixtures.organizations[org],license_number:'SYNTH-'+key,license_expiry:date(now+365*day),duty_status:'on_duty',kyc_verified:true,is_available:true});
    fixtures.drivers[key]=driver_id;
    const vehicle_id=await add('vehicle',{organization_id:fixtures.organizations[org],assigned_driver_id:driver_id,registration_number:'SYNTH-'+key,make:'Synthetic',model:'Test vehicle',vehicle_type:'box_truck',max_payload_kg:key==='bad'?1:1000,max_volume_cbm:key==='bad'?0.1:30,status:key==='bad'?'maintenance':'available'});
    fixtures.vehicles[key]=vehicle_id;
    if(key!=='bad'){
      await add('vehicle_availability',{vehicle_id,organization_id:fixtures.organizations[org],available_from:now,available_until:now+5*day,current_city:'Synthetic Origin',is_active:true});
      for(const document_type of ['INSURANCE','FITNESS','RC_BOOK']){
        await add('compliance_documents',{document_id:randomUUID(),owner_type:'vehicle',owner_id:vehicle_id,document_type,private_storage_key:'synthetic/private/'+key+'/'+document_type,checksum_sha256:'0'.repeat(64),valid_from:date(now-day),valid_until:date(now+365*day),verification_status:'verified'});
      }
    }
  }
  for(const [key,org,status]of [['a','a','booked'],['b','b','booked'],['delivered','a','delivered'],['invalid','a','draft'],['corrupt','a','booked']]){
    const quote_id=randomUUID();fixtures.quotes[key]=quote_id;
    const id=await add('customer_booking',{booking_reference:'SYNTH-BK-'+key,customer_organization_id:fixtures.organizations[org],booked_by_user_id:fixtures.users[org==='a'?'alice':'bob'].id,status,pickup_city:'Synthetic Origin',pickup_address:{city:'Synthetic Origin'},pickup_window_start:start,pickup_window_end:start+3600000,delivery_city:'Synthetic Destination',delivery_address:{city:'Synthetic Destination'},delivery_window_start:end-3600000,delivery_window_end:end,estimated_distance_km:100,quote_amount:100,total_amount:100,currency:'INR',payment_status:'paid_escrow',payment_mode:'prepaid',active_quote_id:quote_id,version:1});
    fixtures.bookings[key]=id;
    await add('booking_quote',{quote_id,booking_id:id,booking_version:1,input_hash:'synthetic-only',policy_version:'synthetic-v1',corridor_code:'SYNTH',vehicle_type:'box_truck',actual_weight_kg:100,volumetric_weight_kg:80,chargeable_weight_kg:100,distance_km:100,base_rate_minor:10000,distance_rate_minor:0,gross_amount_minor:10000,discount_minor:0,net_amount_minor:10000,total_amount:100,currency:'INR',breakdown:{synthetic:true},route_evidence:{synthetic:true},expires_at:now+3*day,is_accepted:true,accepted_at:now});
    if(key!=='invalid')await add('cargo_detail',{booking_id:id,cargo_description:'SYNTHETIC cargo',commodity_type:'general_merchandise',weight_kg:100,volume_cbm:2,package_count:1,packaging_type:'box',is_hazardous:false,requires_temperature_control:false});
  }
  await add('order_holds',{hold_id:randomUUID(),order_id:fixtures.bookings.invalid,scope:'operational',reason_code:'SYNTHETIC_HOLD',opened_by_user_id:fixtures.users.operator.id,opened_at:now,prior_state:'draft',is_active:true});
  await add('active_assignment_reservations',{claim_id:randomUUID(),order_id:fixtures.bookings.invalid,vehicle_id:fixtures.vehicles.bad,driver_id:fixtures.drivers.bad,claim_token:randomUUID(),status:'active',expires_at:now+3*day});
  for(const [key,bookingKey,org,status,amount]of [['captured','a','a','captured',100],['authorized','a','a','authorized',50],['foreign','b','b','captured',100],['corrupt','corrupt','b','captured',100]]){
    fixtures.payments[key]=await add('payment_transaction',{transaction_reference:'SYNTH-TXN-'+key,booking_id:fixtures.bookings[bookingKey],customer_organization_id:fixtures.organizations[org],amount,currency:'INR',status,payment_method:'gateway',gateway_signature:'SYNTHETIC-MUST-NOT-LEAK',gateway_response:{synthetic_secret:'MUST-NOT-LEAK'},captured_at:status==='captured'?now:null});
  }
  await add('refund_request',{refund_reference:'SYNTH-REF-PENDING',payment_transaction_id:fixtures.payments.captured,booking_id:fixtures.bookings.a,refund_amount:20,currency:'INR',reason:'Synthetic pending claim',status:'pending_approval',requested_by_actor_type:'customer',requested_by_user_id:fixtures.users.alice.id});
  const trip=await add('trip',{trip_code:'SYNTH-TRIP-POD',booking_id:fixtures.bookings.delivered,vendor_organization_id:fixtures.organizations.carrier,vehicle_id:fixtures.vehicles.good,driver_id:fixtures.drivers.good,status:'completed',carrier_payout_amount:80,started_at:now-day,completed_at:now-3600000});
  const stop=await add('trip_stop',{trip_id:trip,stop_sequence:1,stop_type:'delivery',facility_name:'Synthetic Receiver',address:{city:'Synthetic Destination'},scheduled_arrival:now-3600000,status:'completed'});
  fixtures.pods.good=await add('proof_of_delivery',{trip_id:trip,stop_id:stop,driver_id:fixtures.drivers.good,status:'submitted',signature_image_url:'https://example.invalid/synthetic/signature',document_image_url:'https://example.invalid/synthetic/document',otp_code:'SYNTHETIC-MUST-NOT-LEAK',otp_verified:true,verified_at:now-3600000});
  fixtures.pods.invalid=await add('proof_of_delivery',{trip_id:trip,stop_id:stop,driver_id:fixtures.drivers.foreign,status:'submitted',signature_image_url:null,document_image_url:null,otp_verified:false});
  c.save('fixtures',fixtures);c.save('fixture-receipts',c.receipts);
  console.log(JSON.stringify({tenant:c.tenant,synthetic:true,requests:c.receipts.length},null,2));
}
main().catch(()=>{console.error('Fixture setup failed. Use a fresh empty tenant; do not reseed a partially populated target.');process.exitCode=1;});
