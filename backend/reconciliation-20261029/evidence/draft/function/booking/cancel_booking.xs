// Executes guarded cancellation of a customer booking prior to fleet dispatch execution
function "booking/cancel_booking" {
  input {
    // Target booking ID
    int booking_id {
      table = "customer_booking"
    }
  
    // Reason for cancellation
    text cancellation_reason filters=trim
  
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
        action_name             : "cancel"
      }
    } as $auth_res
  
    // 3. Pre-dispatch lifecycle guard: cannot cancel once in transport
    precondition ($booking.status == "draft" || $booking.status == "quoted" || $booking.status == "booked") {
      error_type = "badrequest"
      error = "Cannot cancel booking in active transport status '" ~ $booking.status ~ "'. Operational dispute review required."
    }
  
    // 4. Invalidate quotes and pending consent attempts
    function.run "booking/invalidate_quotes" {
      input = {
        booking_id: $booking.id
        reason    : "Booking cancelled by user"
      }
    } as $inval_res
  
    var $next_version {
      value = ($booking.version ?? 1) + 1
    }
  
    // 5. Update booking status to cancelled
    db.edit customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = {
        status             : "cancelled"
        cancellation_reason: $input.cancellation_reason
        version            : $next_version
        updated_at         : "now"
      }
    } as $upd_b
  
    // 6. Write audit log
    db.add audit_log {
      data = {
        created_at    : "now"
        entity_type   : "customer_booking"
        entity_id     : $booking.id
        action        : "booking.cancelled"
        actor_type    : "user"
        actor_id      : $input.caller_user_id
        previous_state: {status: $booking.status}
        new_state     : {
        status: "cancelled"
        reason: $input.cancellation_reason
      }
      }
    } as $audit_rec
  
    // 7. Queue outbox notification
    security.create_uuid as $event_uuid
  
    db.add event_outbox {
      data = {
        created_at       : "now"
        outbox_event_id  : $event_uuid
        aggregate_type   : "customer_booking"
        aggregate_id     : $booking.id
        aggregate_version: $next_version
        event_type       : "order.cancelled"
        destination      : "operations_dashboard"
        payload          : {
        booking_id       : $booking.id
        booking_reference: $booking.booking_reference
        reason           : $input.cancellation_reason
      }
        status           : "queued"
        attempt_count    : 0
        max_attempts     : 3
      }
    } as $outbox_rec
  }

  response = {
    cancelled        : true
    booking_id       : $booking.id
    booking_reference: $booking.booking_reference
    status           : "cancelled"
    version          : $next_version
  }

  guid = "NsEpCNIuHsJO1ufuEl5zZV6jSmw"
}
