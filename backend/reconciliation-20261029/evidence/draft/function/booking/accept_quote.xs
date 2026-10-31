// Accepts an immutable quote for a customer booking, binding exact terms and amount
function "booking/accept_quote" {
  input {
    // Booking ID being confirmed
    int booking_id {
      table = "customer_booking"
    }
  
    // Quote UUID to accept
    uuid quote_id
  
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
      output = [
        "id"
        "customer_organization_id"
        "version"
        "status"
        "active_quote_id"
      ]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    // 2. Authorize caller against booking customer organization
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $input.caller_user_id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "accept"
      }
    } as $auth_res
  
    // 3. Fetch quote record
    db.query booking_quote {
      where = $db.booking_quote.quote_id == $input.quote_id && $db.booking_quote.booking_id == $booking.id
      return = {type: "single"}
      output = [
        "id"
        "quote_id"
        "booking_id"
        "booking_version"
        "total_amount"
        "expires_at"
        "is_accepted"
      ]
    } as $quote
  
    precondition ($quote != null) {
      error_type = "notfound"
      error = "Quote not found for this booking."
    }
  
    // 4. Verify quote expiration
    precondition ($quote.expires_at > now) {
      error_type = "badrequest"
      error = "Quote has expired. A new quote must be calculated before acceptance."
    }
  
    // 5. Verify quote matches current booking specification version
    var $current_v {
      value = $booking.version ?? 1
    }
  
    precondition ($quote.booking_version == $current_v) {
      error_type = "badrequest"
      error = "Quote was generated for an earlier version of the booking specifications. Please recalculate quote."
    }
  
    // 6. Bind accepted quote and update booking version
    db.edit booking_quote {
      field_name = "id"
      field_value = $quote.id
      data = {is_accepted: true, accepted_at: "now"}
    } as $accepted_q
  
    var $next_version {
      value = $current_v + 1
    }
  
    db.edit customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = {
        active_quote_id: $quote.quote_id
        quote_amount   : $quote.total_amount
        total_amount   : $quote.total_amount
        status         : "quoted"
        version        : $next_version
        updated_at     : "now"
      }
    } as $updated_b
  
    // 7. Audit log
    db.add audit_log {
      data = {
        created_at : "now"
        entity_type: "customer_booking"
        entity_id  : $booking.id
        action     : "quote.accepted"
        actor_type : "user"
        actor_id   : $input.caller_user_id
        new_state  : {
        active_quote_id: $quote.quote_id
        total_amount   : $quote.total_amount
        version        : $next_version
      }
      }
    } as $audit_rec
  }

  response = {
    booking_id     : $booking.id
    active_quote_id: $quote.quote_id
    total_amount   : $quote.total_amount
    version        : $next_version
    status         : "quoted"
  }

  guid = "Kw-jyLRhP2gRoSLK_BT8N8S7z48"
}
