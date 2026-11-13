// Opens or releases scoped domain holds (operational, payment, compliance) on a customer booking
function "booking/manage_hold" {
  input {
    // Target booking ID
    int booking_id {
      table = "customer_booking"
    }
  
    // Action: open or release
    text action filters=trim|lower
  
    // Unique hold UUID (required for release)
    uuid? hold_id
  
    // Hold domain scope (operational, payment, settlement, compliance, customs)
    text? scope filters=trim|lower
  
    // Machine-readable reason code
    text? reason_code filters=trim
  
    // Narrative description of hold
    text? description filters=trim
  
    // Documentary evidence justifying release of hold
    text? release_evidence filters=trim
  
    // Authenticated caller user ID
    int caller_user_id {
      table = "user"
    }
  }

  stack {
    // 1. Fetch booking record
    db.get customer_booking {
      field_name = "id"
      field_value = $input.booking_id
      output = ["id", "customer_organization_id", "version", "status"]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    // 2. Authorize caller for hold management
    var $action_req {
      value = ($input.action == "release" ? "release_hold" : "hold")
    }
  
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $input.caller_user_id
        resource_organization_id: $booking.customer_organization_id
        action_name             : $action_req
      }
    } as $auth_res
  
    var $next_version {
      value = ($booking.version ?? 1) + 1
    }
  
    // 3. Open hold
    conditional {
      if ($input.action == "open") {
        precondition ($input.scope != null) {
          error_type = "badrequest"
          error = "Hold scope is required (e.g., operational, payment, compliance)."
        }
      
        precondition ($input.reason_code != null) {
          error_type = "badrequest"
          error = "Hold reason_code is required."
        }
      
        security.create_uuid as $new_hold_uuid
        db.add order_holds {
          data = {
            created_at       : "now"
            hold_id          : $new_hold_uuid
            order_id         : $booking.id
            scope            : $input.scope
            reason_code      : $input.reason_code
            description      : $input.description
            opened_by_user_id: $input.caller_user_id
            opened_at        : "now"
            prior_state      : $booking.status
            is_active        : true
          }
        } as $created_hold
      
        db.edit customer_booking {
          field_name = "id"
          field_value = $booking.id
          data = {version: $next_version, updated_at: "now"}
        } as $upd_b
      
        db.add audit_log {
          data = {
            created_at : "now"
            entity_type: "order_hold"
            entity_id  : $booking.id
            action     : "hold.opened"
            actor_type : "user"
            actor_id   : $input.caller_user_id
            new_state  : {
            hold_id    : $new_hold_uuid
            scope      : $input.scope
            reason_code: $input.reason_code
          }
          }
        } as $audit_rec
      
        var $result {
          value = {
            hold_id    : $new_hold_uuid
            booking_id : $booking.id
            action     : "opened"
            scope      : $input.scope
            is_active  : true
            new_version: $next_version
          }
        }
      }
    
      // 4. Release hold
      elseif ($input.action == "release") {
        precondition ($input.hold_id != null) {
          error_type = "badrequest"
          error = "hold_id is required to release a hold."
        }
      
        db.query order_holds {
          where = $db.order_holds.hold_id == $input.hold_id && $db.order_holds.order_id == $booking.id
          return = {type: "single"}
          output = ["id", "hold_id", "scope", "is_active", "prior_state"]
        } as $target_hold
      
        precondition ($target_hold != null) {
          error_type = "notfound"
          error = "Specified hold record not found on this booking."
        }
      
        precondition ($target_hold.is_active) {
          error_type = "badrequest"
          error = "Hold is already released or inactive."
        }
      
        db.edit order_holds {
          field_name = "id"
          field_value = $target_hold.id
          data = {
            is_active          : false
            released_by_user_id: $input.caller_user_id
            released_at        : "now"
            release_evidence   : $input.release_evidence
          }
        } as $released_h
      
        db.edit customer_booking {
          field_name = "id"
          field_value = $booking.id
          data = {version: $next_version, updated_at: "now"}
        } as $upd_b2
      
        db.add audit_log {
          data = {
            created_at : "now"
            entity_type: "order_hold"
            entity_id  : $booking.id
            action     : "hold.released"
            actor_type : "user"
            actor_id   : $input.caller_user_id
            new_state  : {hold_id: $input.hold_id, released: true}
          }
        } as $audit_rec2
      
        var $result {
          value = {
            hold_id    : $input.hold_id
            booking_id : $booking.id
            action     : "released"
            is_active  : false
            new_version: $next_version
          }
        }
      }
    
      else {
        throw {
          name = "badrequest"
          value = "Invalid action: must be 'open' or 'release'."
        }
      }
    }
  }

  response = $result
  guid = "K6khcEjMraeTCOuc_boKeXAzpbc"
}
