// Enforces optimistic concurrency versioning and atomic scoped request idempotency claims
function "security/validate_command" {
  input {
    // Authenticated caller user ID
    int caller_user_id {
      table = "user"
    }
  
    // Authenticated or resolved organization ID
    int? caller_org_id
  
    // Unique client idempotency key
    text? idempotency_key filters=trim
  
    // Domain operation boundary (e.g., booking.create, booking.confirm, consent.decide)
    text operation_scope filters=trim
  
    // Raw command payload for server-side cryptographic fingerprinting
    json? payload
  
    // Current database version of aggregate
    int? current_version
  
    // Client-asserted expected version for optimistic locking
    int? expected_version
  }

  stack {
    // 1. Optimistic concurrency version check
    conditional {
      if ($input.expected_version != null && $input.current_version != null) {
        precondition ($input.current_version == $input.expected_version) {
          error_type = "badrequest"
          error = "Version conflict: Aggregate has been modified. Expected version " ~ ($input.expected_version|to_text) ~ ", current version " ~ ($input.current_version|to_text) ~ "."
        }
      }
    }
  
    // 2. Server-side payload fingerprinting (client cannot forge hash)
    var $request_hash {
      value = ($input.payload|json_encode)|sha256
    }
  
    var $is_replay {
      value = false
    }
  
    var $cached_response {
      value = null
    }
  
    var $scoped_key {
      value = null
    }
  
    conditional {
      if ($input.idempotency_key != null) {
        // Namespace idempotency key to prevent cross-tenant/cross-user/cross-operation collision
        var.update $scoped_key {
          value = ($input.caller_org_id|to_text) ~ ":" ~ ($input.caller_user_id|to_text) ~ ":" ~ $input.operation_scope ~ ":" ~ $input.idempotency_key
        }
      
        db.get idempotency_key {
          field_name = "key"
          field_value = $scoped_key
          output = ["id", "status", "request_hash", "cached_response", "expires_at"]
        } as $existing_key
      
        conditional {
          if ($existing_key != null) {
            // Check if request payload hash matches original request
            precondition ($existing_key.request_hash == $request_hash) {
              error_type = "badrequest"
              error = "Conflict: Idempotency key reused with different command payload."
            }
          
            conditional {
              if ($existing_key.status == "completed") {
                var.update $is_replay {
                  value = true
                }
              
                var.update $cached_response {
                  value = $existing_key.cached_response
                }
              }
            
              elseif ($existing_key.status == "processing") {
                throw {
                  name = "conflict"
                  value = "A concurrent command with this idempotency key is currently processing."
                }
              }
            }
          }
        
          else {
            // Claim idempotency key atomically with 24-hour lease
            db.add idempotency_key {
              data = {
                created_at     : "now"
                key            : $scoped_key
                target_resource: $input.operation_scope
                request_hash   : $request_hash
                status         : "processing"
                expires_at     : now|add_secs_to_timestamp:(86400|to_int)
              }
            } as $claimed_key
          }
        }
      }
    }
  }

  response = {
    valid          : true
    is_replay      : $is_replay
    cached_response: $cached_response
    scoped_key     : $scoped_key
    request_hash   : $request_hash
  }

  guid = "RDOa_zKGK5GP5tq9gaVfRf4A-_M"
}
