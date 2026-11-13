// Updates booking draft specifications with quote invalidation and version guard
query "bookings/{booking_id}" verb=PATCH {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    // Unique booking ID
    int booking_id {
      table = "customer_booking"
    }
  
    // Client asserted expected version for optimistic concurrency
    int? expected_version
  
    // Client idempotency key
    text? idempotency_key filters=trim
  
    // Updated pickup city
    text? pickup_city filters=trim
  
    // Updated pickup address
    json? pickup_address
  
    // Updated destination city
    text? delivery_city filters=trim
  
    // Updated delivery address
    json? delivery_address
  
    // Updated shipper instructions
    text? special_instructions filters=trim
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
        "pickup_city"
        "delivery_city"
      ]
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
        action_name             : "update"
      }
    } as $auth_res
  
    precondition ($booking.status == "draft" || $booking.status == "quoted") {
      error_type = "badrequest"
      error = "Modifications permitted only while booking is in 'draft' or 'quoted' status."
    }
  
    // 3. Validate command and optimistic concurrency version
    var $cmd_payload {
      value = {
        pickup_city         : $input.pickup_city
        delivery_city       : $input.delivery_city
        special_instructions: $input.special_instructions
      }
    }
  
    function.run "security/validate_command" {
      input = {
        caller_user_id  : $auth.id
        caller_org_id   : $booking.customer_organization_id
        idempotency_key : $input.idempotency_key
        operation_scope : "booking.update"
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
  
    // 4. If route changed, invalidate existing quotes and consent attempts
    var $route_changed {
      value = (($input.pickup_city != null && $input.pickup_city != $booking.pickup_city) || ($input.delivery_city != null && $input.delivery_city != $booking.delivery_city))
    }
  
    conditional {
      if ($route_changed) {
        function.run "booking/invalidate_quotes" {
          input = {
            booking_id: $booking.id
            reason    : "Route specifications modified"
          }
        } as $inval_res
      }
    }
  
    var $next_version {
      value = ($booking.version ?? 1) + 1
    }
  
    // 5. Apply partial updates
    var $updates {
      value = {version: $next_version, updated_at: "now"}
    }
  
    conditional {
      if ($input.pickup_city != null) {
        var.update $updates.pickup_city {
          value = $input.pickup_city
        }
      }
    }
  
    conditional {
      if ($input.pickup_address != null) {
        var.update $updates.pickup_address {
          value = $input.pickup_address
        }
      }
    }
  
    conditional {
      if ($input.delivery_city != null) {
        var.update $updates.delivery_city {
          value = $input.delivery_city
        }
      }
    }
  
    conditional {
      if ($input.delivery_address != null) {
        var.update $updates.delivery_address {
          value = $input.delivery_address
        }
      }
    }
  
    conditional {
      if ($input.special_instructions != null) {
        var.update $updates.special_instructions {
          value = $input.special_instructions
        }
      }
    }
  
    db.patch customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = $updates
    } as $updated_booking
  
    // 6. Audit log
    db.add audit_log {
      data = {
        created_at : "now"
        entity_type: "customer_booking"
        entity_id  : $booking.id
        action     : "booking.updated"
        actor_type : "user"
        actor_id   : $auth.id
        new_state  : {version: $next_version, route_changed: $route_changed}
      }
    } as $audit_rec
  
    var $result {
      value = {
        booking_id   : $booking.id
        version      : $next_version
        route_changed: $route_changed
        status       : $updated_booking.status
      }
    }
  
    // 7. Complete idempotency
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
  guid = "eZJf-oxiWY24O97XjWNAAJ51m9s"
}
