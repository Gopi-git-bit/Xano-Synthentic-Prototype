// Bounded synthetic acceptance slice; not a production API.
function "Slice1/command_probe" {
  input {
    int user_id
    uuid expected_platform_id
    uuid vehicle_id
    uuid driver_profile_id
    text idempotency_key filters=trim|min:1|max:128
    text cargo_description filters=trim|min:1|max:500
    decimal cargo_weight_kg filters=min:0.001
    text body_type?=closed filters=trim|min:1|max:64
    enum fault?=none {
      values = ["none", "after_order", "after_assignment"]
    }
  
    decimal hold_seconds? filters=min:0|max:2
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $db_identity
  
    precondition ($db_identity.database == "sn9m-aat6-200c") {
      error_type = "accessdenied"
      error = "Synthetic slice is restricted to the verified sandbox database"
    }
  
    function.run "Logistics/resolve_identity" {
      input = {user_id: $input.user_id}
    } as $identity
  
    precondition ($identity.platform_id == $input.expected_platform_id) {
      error_type = "accessdenied"
      error = "Platform does not match authenticated identity"
    }
  
    var $is_customer {
      value = false
    }
  
    var $is_admin {
      value = false
    }
  
    foreach ($identity.roles) {
      each as $role {
        conditional {
          if ($role == "customer") {
            var.update $is_customer {
              value = true
            }
          }
        }
      
        conditional {
          if ($role == "admin") {
            var.update $is_admin {
              value = true
            }
          }
        }
      }
    }
  
    precondition ($is_customer && $is_admin && $identity.customer != null) {
      error_type = "accessdenied"
      error = "Synthetic coordinator requires both server-resolved customer and admin memberships"
    }
  
    precondition ($identity.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $identity.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048") {
      error_type = "accessdenied"
      error = "Only this run synthetic platforms are permitted"
    }
  
    var $today {
      value = now|format_timestamp:"Y-m-d":"UTC"
    }
  
    var $scope {
      value = "slice1:create_assign:" ~ $identity.account_id
    }
  
    var $business {
      value = {
        vehicle_id       : $input.vehicle_id
        driver_profile_id: $input.driver_profile_id
        cargo_description: $input.cargo_description
        cargo_weight_kg  : $input.cargo_weight_kg
        body_type        : $input.body_type
        policy_version   : "test-m3-v1"
        distance_km      : 10
      }
    }
  
    var $fingerprint {
      value = $business|json_encode|sha256:false
    }
  
    function.run "Logistics/validate_order" {
      input = {
        payload: {
        pickup             : {
        address  : "Synthetic origin"
        latitude : 18.5204
        longitude: 73.8567
      }
        delivery           : {
        address  : "Synthetic destination"
        latitude : 19.076
        longitude: 72.8777
      }
        cargo_description  : $input.cargo_description
        cargo_weight_kg    : $input.cargo_weight_kg
        distance_km        : 10
        service            : {
        vehicle_class: "light"
        body_type    : $input.body_type
        hazardous    : false
        return_trip  : false
      }
        requested_pickup_at: "2030-01-02T10:00:00+05:30"
      }
      }
    } as $validation
  
    precondition ($validation.valid) {
      error_type = "accessdenied"
      error = "Invalid synthetic order input"
    }
  
    function.run "Logistics/calculate_test_quote" {
      input = {
        payload: {
        policy_version : "test-m3-v1"
        base_amount    : "100.00"
        per_km         : "12.50"
        per_kg         : "0.75"
        distance_km    : 10
        cargo_weight_kg: $input.cargo_weight_kg
        currency       : "INR"
      }
      }
    } as $pricing
  
    precondition ($pricing.valid) {
      error_type = "accessdenied"
      error = "Test pricing configuration invalid"
    }
  
    var $ids {
      value = []
    }
  
    for (32) {
      each as $index {
        security.create_uuid as $uuid
        array.push $ids {
          value = $uuid
        }
      }
    }
  
    var $result {
      value = null
    }
  
    db.transaction {
      stack {
        db.direct_query {
          sql = "SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(CAST(? AS text), 0))"
          response_type = "single"
          arg = [("slice1:61aa324d:" ~ $identity.platform_id)]
        } as $locked
      
        db.direct_query {
          sql = "SELECT 1 AS held FROM pg_sleep(CAST(? AS double precision))"
          response_type = "single"
          arg = [$input.hold_seconds]
        } as $held
      }
    }
  }

  response = {stage_passed: true}
  guid = "V4Xr0C2O5veTa1pxXgeMR7K2BJI"
}