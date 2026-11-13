// Re-evaluates gates and restores booking to legal status after holds are cleared
query "bookings/{booking_id}/resume" verb=POST {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    // Unique booking ID
    int booking_id {
      table = "customer_booking"
    }
  
    // Expected aggregate version
    int? expected_version
  
    // Optional client idempotency key
    text? idempotency_key filters=trim
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
  
    // 2. Authorize caller
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $auth.id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "resume"
      }
    } as $auth_res
  
    // 3. Idempotency validation
    var $cmd_payload {
      value = {booking_id: $input.booking_id}
    }
  
    function.run "security/validate_command" {
      input = {
        caller_user_id  : $auth.id
        caller_org_id   : $booking.customer_organization_id
        idempotency_key : $input.idempotency_key
        operation_scope : "booking.resume"
        payload         : $cmd_payload
        current_version : $booking.version
        expected_version: $input.expected_version
      }
    } as $idemp
  
    conditional {
      if ($idemp.is_replay) {
        return {
          value = $idemp.cached_response
        }
      }
    }
  
    // 4. Execute domain service
    function.run "booking/resume_booking" {
      input = {booking_id: $booking.id, caller_user_id: $auth.id}
    } as $result
  
    // 5. Complete idempotency
    conditional {
      if ($idemp.scoped_key != null) {
        function.run "security/complete_idempotency" {
          input = {scoped_key: $idemp.scoped_key, response_data: $result}
        } as $comp
      }
    }
  }

  response = $result
  middleware = {post: [{name: "Zippy_request_guard"}]}
  guid = "iINhgTaUOWgnOGkcECxAK6jPrls"
}
