// Idempotent, authenticated draft creation only. Current identity and membership are checked on every attempt.
query bookings verb=POST {
  api_group = "Customer Draft Bookings"
  auth = "user"
  input {
    uuid request_id
    text pickup_city filters=trim|min:1|max:100
    text pickup_street filters=trim|min:1|max:200
    text delivery_city filters=trim|min:1|max:100
    text delivery_street filters=trim|min:1|max:200
    timestamp pickup_window_start
    timestamp pickup_window_end
    timestamp delivery_window_start
    timestamp delivery_window_end
  }
  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
    precondition ($context.can_book && ($context.member_role == "owner" || $context.member_role == "admin" || $context.member_role == "dispatcher" || $context.member_role == "member")) {
      error_type = "accessdenied"
      error = "Customer draft creation role required."
    }
    util.get_raw_input {
      encoding = "json"
      exclude_middleware = false
    } as $raw
    var $allowed {
      value = ["request_id", "pickup_city", "pickup_street", "delivery_city", "delivery_street", "pickup_window_start", "pickup_window_end", "delivery_window_start", "delivery_window_end"]
    }
    foreach ($raw|keys) {
      each as $key {
        precondition ($allowed|in:$key) {
          error_type = "inputerror"
          error = "Unsupported draft field."
        }
      }
    }
    // Hash a fixed-order array of validated primitives, never arbitrary JSON objects.
    var $fingerprint {
      value = [$input.pickup_city, $input.pickup_street, $input.delivery_city, $input.delivery_street, $input.pickup_window_start, $input.pickup_window_end, $input.delivery_window_start, $input.delivery_window_end]|json_encode|sha256
    }
    var $key {
      value = "customer-draft:" ~ $context.organization_id ~ ":" ~ $auth.id ~ ":" ~ $input.request_id
    }
    db.get idempotency_key {
      field_name = "key"
      field_value = $key
    } as $existing
    conditional {
      if ($existing != null) {
        precondition ($existing.target_resource == "customer_draft" && $existing.status == "completed" && $existing.request_hash == $fingerprint) {
          error_type = "inputerror"
          error = "Request ID is in use with a different or incomplete request."
        }
        return { value = $existing.cached_response }
      }
    }
    precondition ($input.pickup_window_start > now && $input.pickup_window_end > $input.pickup_window_start && $input.delivery_window_start >= $input.pickup_window_end && $input.delivery_window_end > $input.delivery_window_start) {
      error_type = "inputerror"
      error = "Future, ordered pickup and delivery windows required."
    }
    security.create_uuid as $reference
    var $result { value = null }
    try_catch {
      try {
        db.transaction {
          stack {
            // Unique key fences concurrent creates. A competing request retries the same request_id.
            db.add idempotency_key {
              data = {key: $key, target_resource: "customer_draft", request_hash: $fingerprint, status: "processing", expires_at: now|add_secs_to_timestamp:604800}
            } as $claim
            db.add customer_booking {
              data = {
                booking_reference: "DRAFT-" ~ $reference
                customer_organization_id: $context.organization_id
                booked_by_user_id: $auth.id
                status: "draft"
                pickup_city: $input.pickup_city
                pickup_address: {city: $input.pickup_city, street: $input.pickup_street}
                delivery_city: $input.delivery_city
                delivery_address: {city: $input.delivery_city, street: $input.delivery_street}
                pickup_window_start: $input.pickup_window_start
                pickup_window_end: $input.pickup_window_end
                delivery_window_start: $input.delivery_window_start
                delivery_window_end: $input.delivery_window_end
                estimated_distance_km: 0
                quote_amount: 0
                total_amount: 0
                currency: "INR"
                payment_status: "pending"
                payment_mode: "prepaid"
                matching_status: "unmatched"
                version: 1
              }
              output = ["id", "booking_reference", "customer_organization_id", "status", "payment_status", "payment_mode", "pickup_city", "delivery_city", "version"]
            } as $booking
            db.add audit_log {
              data = {entity_type: "customer_booking", entity_id: $booking.id, action: "customer_draft_created", actor_type: "user", actor_id: $auth.id, new_state: {status: "draft", version: 1, organization_id: $context.organization_id}}
            } as $audit
            db.edit idempotency_key {
              field_name = "id"
              field_value = $claim.id
              data = {status: "completed", cached_response: {booking: $booking, draft_only: true, execution_enabled: false}}
            } as $completed
          }
        }
        var.update $result { value = $completed.cached_response }
      }
      catch {
        precondition (false) {
          error_type = "inputerror"
          error = "Draft could not be committed. Retry with the same request_id."
        }
      }
    }
  }
  response = $result
  guid = "ucn3naFi2oG9imqtFNdbSd080ho"
}
