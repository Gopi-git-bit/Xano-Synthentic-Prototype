// Persists the final command response into the idempotency ledger, completing the transaction boundary
function "security/complete_idempotency" {
  input {
    // Scoped idempotency key returned by validate_command
    text? scoped_key filters=trim
  
    // Stored response envelope to cache for idempotent replays
    json? response_data
  }

  stack {
    conditional {
      if ($input.scoped_key != null) {
        db.get idempotency_key {
          field_name = "key"
          field_value = $input.scoped_key
          output = ["id"]
        } as $rec
      
        conditional {
          if ($rec != null) {
            db.edit idempotency_key {
              field_name = "id"
              field_value = $rec.id
              data = {
                status         : "completed"
                cached_response: $input.response_data
              }
            } as $updated_idemp
          }
        }
      }
    }
  }

  response = true
  guid = "hthO2TYH9smLTd0iPJmpmnrFUSs"
}
