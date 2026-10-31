// Evaluates all business, pricing, hold, and payment gates to transition a booking to CONFIRMED (booked)
function "booking/confirm_booking" {
  input {
    // Booking ID to confirm
    int booking_id {
      table = "customer_booking"
    }
  
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
        "booking_reference"
        "customer_organization_id"
        "version"
        "status"
        "payment_mode"
        "payment_status"
        "active_quote_id"
        "total_amount"
      ]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    // 2. Authorize caller
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $input.caller_user_id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "confirm"
      }
    } as $auth_res
  
    // 3. Verify booking status is draft or quoted
    precondition ($booking.status == "draft" || $booking.status == "quoted") {
      error_type = "badrequest"
      error = "Booking is already in state " ~ $booking.status ~ ". Confirmation only permitted for draft or quoted bookings."
    }
  
    // 4. Verify active accepted quote
    precondition ($booking.active_quote_id != null) {
      error_type = "badrequest"
      error = "Cannot confirm booking without an accepted quote."
    }
  
    db.query booking_quote {
      where = $db.booking_quote.quote_id == $booking.active_quote_id
      return = {type: "single"}
      output = ["id", "expires_at", "is_accepted"]
    } as $quote
  
    precondition ($quote != null && $quote.is_accepted) {
      error_type = "badrequest"
      error = "Active quote has not been accepted."
    }
  
    precondition ($quote.expires_at > now) {
      error_type = "badrequest"
      error = "Accepted quote has expired. Please recalculate and re-accept quote before confirming."
    }
  
    // 5. Evaluate blocking holds
    db.query order_holds {
      where = $db.order_holds.order_id == $booking.id && $db.order_holds.is_active == true
      return = {type: "list"}
      output = ["id", "reason_code", "scope"]
    } as $active_holds
  
    precondition (($active_holds|count) == 0) {
      error_type = "badrequest"
      error = "Cannot confirm booking: active operational holds are engaged on this order."
    }
  
    // 6. Evaluate payment mode gate
    conditional {
      if ($booking.payment_mode == "prepaid") {
        precondition ($booking.payment_status == "paid_escrow") {
          error_type = "badrequest"
          error = "Prepaid confirmation requires verified payment escrow. Status is currently pending payment."
        }
      }
    
      elseif ($booking.payment_mode == "topay") {
        db.query topay_consent_attempts {
          where = $db.topay_consent_attempts.order_id == $booking.id && $db.topay_consent_attempts.decision == "accepted" && $db.topay_consent_attempts.expires_at > now
          return = {type: "list"}
          output = ["id"]
        } as $consents
      
        precondition (($consents|count) > 0) {
          error_type = "badrequest"
          error = "ToPay confirmation requires verified accepted consignee payment consent."
        }
      }
    
      else {
        throw {
          name = "unsupported_mode"
          value = "Credit payment mode is not supported in this release."
        }
      }
    }
  
    // 7. Transition booking to booked (CONFIRMED)
    var $next_version {
      value = ($booking.version ?? 1) + 1
    }
  
    db.edit customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = {
        status    : "booked"
        version   : $next_version
        updated_at: "now"
      }
    } as $confirmed_b
  
    // 8. Queue outbox event for autonomous dispatch matching
    security.create_uuid as $event_uuid
  
    db.add event_outbox {
      data = {
        created_at       : "now"
        outbox_event_id  : $event_uuid
        aggregate_type   : "customer_booking"
        aggregate_id     : $booking.id
        aggregate_version: $next_version
        event_type       : "order.confirmed"
        destination      : "matching_agent"
        payload          : {
        booking_id       : $booking.id
        booking_reference: $booking.booking_reference
        payment_mode     : $booking.payment_mode
        total_amount     : $booking.total_amount
      }
        status           : "queued"
        attempt_count    : 0
        max_attempts     : 3
      }
    } as $outbox_rec
  
    // 9. Write audit log
    db.add audit_log {
      data = {
        created_at    : "now"
        entity_type   : "customer_booking"
        entity_id     : $booking.id
        action        : "booking.confirmed"
        actor_type    : "user"
        actor_id      : $input.caller_user_id
        previous_state: {status: $booking.status}
        new_state     : {status: "booked", version: $next_version}
      }
    } as $audit_rec
  }

  response = {
    booking_id       : $booking.id
    booking_reference: $booking.booking_reference
    status           : "booked"
    version          : $next_version
    confirmed        : true
  }

  guid = "P9PG7pf127fKSqeDZpVmLT_hdLs"
}
