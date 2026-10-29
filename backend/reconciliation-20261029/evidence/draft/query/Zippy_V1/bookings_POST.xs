// Creates a new freight booking draft with itemized cargo and service windows
query bookings verb=POST {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    // Client idempotency key for replay protection
    text? idempotency_key filters=trim
  
    // Optional organization context
    int? requested_org_id
  
    // Primary pickup city
    text pickup_city filters=trim
  
    // Structured pickup address
    json pickup_address
  
    // Scheduled pickup window start timestamp
    timestamp pickup_window_start
  
    // Scheduled pickup window deadline timestamp
    timestamp pickup_window_end
  
    // Primary destination city
    text delivery_city filters=trim
  
    // Structured delivery address
    json delivery_address
  
    // Scheduled delivery window start timestamp
    timestamp delivery_window_start
  
    // Scheduled delivery window deadline timestamp
    timestamp delivery_window_end
  
    // Cargo itemization array
    json cargo_items
  
    // Estimated transit distance in km
    decimal? estimated_distance_km filters=min:0
  
    // Special shipper handling instructions
    text? special_instructions filters=trim
  }

  stack {
    // 1. Resolve caller security context
    function.run "security/resolve_context" {
      input = {
        user_id         : $auth.id
        requested_org_id: $input.requested_org_id
      }
    } as $caller_ctx
  
    // 2. Validate idempotency boundary
    var $cmd_payload {
      value = {
        pickup_city          : $input.pickup_city
        delivery_city        : $input.delivery_city
        pickup_window_start  : $input.pickup_window_start
        pickup_window_end    : $input.pickup_window_end
        delivery_window_start: $input.delivery_window_start
        delivery_window_end  : $input.delivery_window_end
        cargo_items          : $input.cargo_items
      }
    }
  
    function.run "security/validate_command" {
      input = {
        caller_user_id  : $auth.id
        caller_org_id   : $caller_ctx.organization_id
        idempotency_key : $input.idempotency_key
        operation_scope : "booking.create"
        payload         : $cmd_payload
        current_version : null
        expected_version: null
      }
    } as $idemp
  
    conditional {
      if ($idemp.is_replay) {
        return {
          value = $idemp.cached_response
        }
      }
    }
  
    // 3. Execute domain service
    function.run "booking/create_draft" {
      input = {
        caller_user_id       : $auth.id
        requested_org_id     : $input.requested_org_id
        pickup_city          : $input.pickup_city
        pickup_address       : $input.pickup_address
        pickup_window_start  : $input.pickup_window_start
        pickup_window_end    : $input.pickup_window_end
        delivery_city        : $input.delivery_city
        delivery_address     : $input.delivery_address
        delivery_window_start: $input.delivery_window_start
        delivery_window_end  : $input.delivery_window_end
        cargo_items          : $input.cargo_items
        estimated_distance_km: $input.estimated_distance_km
        special_instructions : $input.special_instructions
      }
    } as $result
  
    // 4. Complete idempotency transaction
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
  guid = "YBEzcApCI-ywnoCzLNNmFhnaDGU"
}
