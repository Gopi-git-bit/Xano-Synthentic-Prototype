// Source: current repository PRD, approved decisions and canonical operational contracts.
function "Logistics/evaluate_dispatch" {
  input {
    json payload
  }

  stack {
    api.lambda {
      code = """
        function verdict(valid, code, extra = {}) { return {valid, code, ...extra}; }
        function decimal(value, scale = 3, maxDigits = 12) {
          if (typeof value !== "string" && typeof value !== "number") return null;
          const s = String(value);
          if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
          const [whole, fraction = ""] = s.split(".");
          if (fraction.length > scale || whole.replace("-", "").replace(/^0+/, "").length > maxDigits-scale) return null;
          const sign = s.startsWith("-") ? -1n : 1n;
          return sign * BigInt(whole.replace("-", "") + fraction.padEnd(scale,"0"));
        }
        function money(value) { return decimal(value,2,18); }
        function exactKeys(obj, keys) {
          return obj && typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).every(k=>keys.includes(k));
        }
        function text(value, max) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max; }
        function validate_order(p) {
          if (!exactKeys(p, ["pickup","delivery","cargo_description","cargo_weight_kg","distance_km","service","requested_pickup_at","special_handling_code"])) return verdict(false,"VALIDATION_FAILED");
          const weight=decimal(p.cargo_weight_kg), distance=decimal(p.distance_km);
          if (weight === null || weight <= 0n || distance === null || distance <= 0n || !text(p.cargo_description,500)) return verdict(false,"VALIDATION_FAILED");
          for(const stop of [p.pickup,p.delivery]){
            if(!exactKeys(stop,["address","latitude","longitude","accuracy_meters"]) || !text(stop.address,500))return verdict(false,"VALIDATION_FAILED");
            const lat=Number(stop.latitude), lng=Number(stop.longitude);
            if(stop.latitude===null || stop.longitude===null || stop.latitude==="" || stop.longitude==="" || !["number","string"].includes(typeof stop.latitude) || !["number","string"].includes(typeof stop.longitude) || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)return verdict(false,"VALIDATION_FAILED");
            if(stop.accuracy_meters!==undefined && stop.accuracy_meters!==null && (decimal(stop.accuracy_meters,3)===null || Number(stop.accuracy_meters)<0))return verdict(false,"VALIDATION_FAILED");
          }
          if(Number(p.pickup.latitude)===Number(p.delivery.latitude) && Number(p.pickup.longitude)===Number(p.delivery.longitude))return verdict(false,"IDENTICAL_STOPS");
          if(!exactKeys(p.service,["vehicle_class","body_type","hazardous","return_trip"]) || !text(p.service.vehicle_class,64) || !text(p.service.body_type,64))return verdict(false,"VALIDATION_FAILED");
          if(p.service.hazardous!==undefined && typeof p.service.hazardous!=="boolean")return verdict(false,"VALIDATION_FAILED");
          if(p.service.return_trip!==undefined && typeof p.service.return_trip!=="boolean")return verdict(false,"VALIDATION_FAILED");
          if(p.service.hazardous===true)return verdict(false,"HAZARDOUS_CARGO_UNSUPPORTED");
          if(p.service.return_trip===true)return verdict(false,"RETURN_TRIP_POLICY_UNAPPROVED");
          if(typeof p.requested_pickup_at!=="string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(p.requested_pickup_at) || !Number.isFinite(Date.parse(p.requested_pickup_at)))return verdict(false,"PICKUP_TIMEZONE_REQUIRED");
          const dateOnly=p.requested_pickup_at.slice(0,10);
          if(new Date(dateOnly+"T00:00:00Z").toISOString().slice(0,10)!==dateOnly)return verdict(false,"VALIDATION_FAILED");
          if(p.special_handling_code!==undefined && p.special_handling_code!==null && (typeof p.special_handling_code!=="string" || p.special_handling_code.trim().length>64))return verdict(false,"VALIDATION_FAILED");
          return verdict(true,"VALID");
        }
        function validate_payment_plan(p) {
          const total=money(p.total), advance=money(p.advance);
          if(total===null || advance===null || total<=0n || advance<0n)return verdict(false,"INVALID_PAYMENT_AMOUNT");
          const valid=(p.mode==="full" && advance===total) || (p.mode==="partial" && advance*2n>=total) || (p.mode==="to_pay" && advance===0n);
          return verdict(valid, valid?"VALID":"INVALID_PAYMENT_PLAN");
        }
        function validate_transition(p) {
          if(p.account_status!=="active" || p.authorized!==true)return verdict(false,"FORBIDDEN");
          if(!Number.isSafeInteger(p.version) || p.version<=0 || !Number.isSafeInteger(p.expected_version) || p.expected_version<=0 || p.version!==p.expected_version || p.status!==p.expected_status)return verdict(false,"STATE_CONFLICT");
          if(!text(p.reason,500))return verdict(false,"REASON_REQUIRED");
          const edges=["pending:quoted","pending:cancelled","quoted:confirmed","quoted:cancelled","confirmed:assigned","confirmed:cancelled","assigned:in_transit","assigned:cancelled","in_transit:delivered"];
          const valid=edges.includes(p.status+":"+p.next_status);
          return verdict(valid,valid?"VALID":"ILLEGAL_TRANSITION");
        }
        function calculate_test_quote(p) {
          if(typeof p.policy_version!=="string" || !p.policy_version.startsWith("test-"))return verdict(false,"PRICING_POLICY_UNAPPROVED");
          const base=money(p.base_amount), km=money(p.per_km), kg=money(p.per_kg), distance=decimal(p.distance_km), weight=decimal(p.cargo_weight_kg);
          if([base,km,kg,distance,weight].some(v=>v===null) || base<0n || km<0n || kg<0n || distance<=0n || weight<=0n || !/^[A-Z]{3}$/.test(p.currency||""))return verdict(false,"INVALID_PRICING_INPUT");
          const minor=(base*1000n+km*distance+kg*weight+500n)/1000n;
          if(minor>999999999999999999n)return verdict(false,"AMOUNT_OUT_OF_RANGE");
          const digits=minor.toString().padStart(3,"0");
          return verdict(true,"VALID",{amount:digits.slice(0,-2)+"."+digits.slice(-2),amount_minor:minor.toString(),currency:p.currency,policy_version:p.policy_version});
        }
        function evaluate_dispatch(p) {
          if(p.vendor_status!=="approved" || p.driver_status!=="approved" || p.vehicle_status!=="approved" || p.account_status!=="active")return verdict(false,"PROVIDER_INELIGIBLE");
          if(p.same_platform!==true || p.association_valid!==true || p.actor_authorized!==true)return verdict(false,"FORBIDDEN");
          if(p.vehicle_busy!==false || p.driver_busy!==false)return verdict(false,"RESOURCE_BUSY");
          const weight=decimal(p.cargo_weight_kg), capacity=decimal(p.capacity_kg);
          if(weight===null || capacity===null || weight<=0n || capacity<=0n || weight>capacity)return verdict(false,"CAPACITY_EXCEEDED");
          if(!text(p.required_body_type,64) || !text(p.vehicle_body_type,64) || p.required_body_type.trim().toLowerCase()!==p.vehicle_body_type.trim().toLowerCase())return verdict(false,"BODY_TYPE_MISMATCH");
          const at=Date.parse(p.checked_at);
          if(!Number.isFinite(at))return verdict(false,"CHECK_TIME_REQUIRED");
          for(const doc of [p.insurance,p.fitness]){
            if(!doc || doc.status!=="verified" || !/^\d{4}-\d{2}-\d{2}$/.test(doc.valid_until||"") || !Number.isFinite(Date.parse(doc.valid_until)) || doc.valid_until < p.checked_at.slice(0,10))return verdict(false,"COMPLIANCE_DOCUMENT_INVALID");
          }
          return verdict(true,"ELIGIBLE");
        }
        function evaluate_refund(p) {
          if(p.account_status!=="active" || p.is_human!==true || p.is_admin!==true || p.same_platform!==true)return verdict(false,"HUMAN_APPROVAL_REQUIRED");
          if(!text(p.requester_account_id,128) || !text(p.approver_account_id,128) || p.requester_account_id===p.approver_account_id)return verdict(false,"SELF_APPROVAL_FORBIDDEN");
          if(p.request_status!=="requested" || !["approved","rejected"].includes(p.decision) || !text(p.reason,500))return verdict(false,"INVALID_REFUND_DECISION");
          return verdict(true,"VALID",{execution_authorized:false});
        }
        function evaluate_settlement(p) {
          if(p.same_platform!==true || p.actor_authorized!==true)return verdict(false,"FORBIDDEN");
          if(p.order_status!=="delivered")return verdict(false,"ORDER_NOT_DELIVERED");
          if(p.pod_status!=="accepted" || !text(p.pod_verified_by,128))return verdict(false,"POD_REQUIRED");
          return verdict(true,"ELIGIBLE",{execution_authorized:false});
        }
        function retry_delay(p) {
          if(!Number.isSafeInteger(p.attempt) || p.attempt<1 || !Number.isSafeInteger(p.max_attempts) || p.max_attempts<1 || !Number.isSafeInteger(p.base_seconds) || p.base_seconds<1 || !Number.isSafeInteger(p.max_seconds) || p.max_seconds<p.base_seconds)return verdict(false,"INVALID_RETRY_POLICY");
          if(p.attempt>=p.max_attempts)return verdict(true,"DEAD_LETTER",{retryable:false,delay_seconds:0});
          return verdict(true,"RETRY",{retryable:true,delay_seconds:Math.min(p.max_seconds,p.base_seconds*2**Math.min(p.attempt-1,52))});
        }
        const domain={validate_order,validate_payment_plan,validate_transition,calculate_test_quote,evaluate_dispatch,evaluate_refund,evaluate_settlement,retry_delay};
        
        
        
        return domain.evaluate_dispatch($input.payload);
        """
      timeout = 10
    } as $result
  }

  response = $result
  tags = ["zippy:prototype", "zippy:domain-predicate"]

  test "compliant capacity boundary" {
    input = {
      payload: {"vendor_status":"approved","driver_status":"approved","vehicle_status":"approved","account_status":"active","same_platform":true,"association_valid":true,"actor_authorized":true,"vehicle_busy":false,"driver_busy":false,"cargo_weight_kg":"500","capacity_kg":"500","required_body_type":"Closed","vehicle_body_type":"closed","checked_at":"2030-01-01T10:00:00Z","insurance":{"status":"verified","valid_until":"2030-01-02"},"fitness":{"status":"verified","valid_until":"2030-01-01"}}
    }
  
    expect.to_equal ($response.valid) {
      value = true
    }
  }

  test "overweight exclusion" {
    input = {
      payload: {"vendor_status":"approved","driver_status":"approved","vehicle_status":"approved","account_status":"active","same_platform":true,"association_valid":true,"actor_authorized":true,"vehicle_busy":false,"driver_busy":false,"cargo_weight_kg":"500.001","capacity_kg":"500","required_body_type":"Closed","vehicle_body_type":"closed","checked_at":"2030-01-01T10:00:00Z","insurance":{"status":"verified","valid_until":"2030-01-02"},"fitness":{"status":"verified","valid_until":"2030-01-01"}}
    }
  
    expect.to_equal ($response.valid) {
      value = false
    }
  
    expect.to_equal ($response.code) {
      value = "CAPACITY_EXCEEDED"
    }
  }

  test "expired insurance" {
    input = {
      payload: {"vendor_status":"approved","driver_status":"approved","vehicle_status":"approved","account_status":"active","same_platform":true,"association_valid":true,"actor_authorized":true,"vehicle_busy":false,"driver_busy":false,"cargo_weight_kg":"500","capacity_kg":"500","required_body_type":"Closed","vehicle_body_type":"closed","checked_at":"2030-01-01T10:00:00Z","insurance":{"status":"verified","valid_until":"2029-12-31"},"fitness":{"status":"verified","valid_until":"2030-01-01"}}
    }
  
    expect.to_equal ($response.valid) {
      value = false
    }
  }

  test "busy driver excluded" {
    input = {
      payload: {"vendor_status":"approved","driver_status":"approved","vehicle_status":"approved","account_status":"active","same_platform":true,"association_valid":true,"actor_authorized":true,"vehicle_busy":false,"driver_busy":true,"cargo_weight_kg":"500","capacity_kg":"500","required_body_type":"Closed","vehicle_body_type":"closed","checked_at":"2030-01-01T10:00:00Z","insurance":{"status":"verified","valid_until":"2030-01-02"},"fitness":{"status":"verified","valid_until":"2030-01-01"}}
    }
  
    expect.to_equal ($response.valid) {
      value = false
    }
  
    expect.to_equal ($response.code) {
      value = "RESOURCE_BUSY"
    }
  }

  test "body compatibility enforced" {
    input = {
      payload: {"vendor_status":"approved","driver_status":"approved","vehicle_status":"approved","account_status":"active","same_platform":true,"association_valid":true,"actor_authorized":true,"vehicle_busy":false,"driver_busy":false,"cargo_weight_kg":"500","capacity_kg":"500","required_body_type":"Closed","vehicle_body_type":"open","checked_at":"2030-01-01T10:00:00Z","insurance":{"status":"verified","valid_until":"2030-01-02"},"fitness":{"status":"verified","valid_until":"2030-01-01"}}
    }
  
    expect.to_equal ($response.valid) {
      value = false
    }
  
    expect.to_equal ($response.code) {
      value = "BODY_TYPE_MISMATCH"
    }
  }

  test "cross platform denied" {
    input = {
      payload: {"vendor_status":"approved","driver_status":"approved","vehicle_status":"approved","account_status":"active","same_platform":false,"association_valid":true,"actor_authorized":true,"vehicle_busy":false,"driver_busy":false,"cargo_weight_kg":"500","capacity_kg":"500","required_body_type":"Closed","vehicle_body_type":"closed","checked_at":"2030-01-01T10:00:00Z","insurance":{"status":"verified","valid_until":"2030-01-02"},"fitness":{"status":"verified","valid_until":"2030-01-01"}}
    }
  
    expect.to_equal ($response.valid) {
      value = false
    }
  
    expect.to_equal ($response.code) {
      value = "FORBIDDEN"
    }
  }

  guid = "AK9wKo6KYvU37LWeJ2-UFutS9Yk"
}