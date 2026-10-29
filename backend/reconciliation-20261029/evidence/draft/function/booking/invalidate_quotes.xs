// Invalidates accepted quotes and active consents when booking specifications change
function "booking/invalidate_quotes" {
  input {
    // Booking ID being amended
    int booking_id {
      table = "customer_booking"
    }
  
    // Reason for invalidation (e.g., cargo_updated, route_modified)
    text reason filters=trim
  }

  stack {
    // 1. Fetch current booking
    db.get customer_booking {
      field_name = "id"
      field_value = $input.booking_id
      output = ["id", "version", "status", "active_quote_id"]
    } as $booking
  
    var $new_version {
      value = 1
    }
  
    conditional {
      if ($booking != null) {
        var.update $new_version {
          value = ($booking.version ?? 1) + 1
        }
      
        // 2. Clear accepted quotes for this booking
        db.query booking_quote {
          where = $db.booking_quote.booking_id == $booking.id && $db.booking_quote.is_accepted == true
          return = {type: "list"}
          output = ["id"]
        } as $accepted_quotes
      
        foreach ($accepted_quotes) {
          each as $q {
            db.edit booking_quote {
              field_name = "id"
              field_value = $q.id
              data = {is_accepted: false}
            } as $revoked_quote
          }
        }
      
        // 3. Invalidate active/pending ToPay consent attempts
        db.query topay_consent_attempts {
          where = $db.topay_consent_attempts.order_id == $booking.id && $db.topay_consent_attempts.decision == "pending"
          return = {type: "list"}
          output = ["id"]
        } as $pending_consents
      
        foreach ($pending_consents) {
          each as $c {
            db.edit topay_consent_attempts {
              field_name = "id"
              field_value = $c.id
              data = {
                decision     : "expired"
                denial_reason: "Quote or specifications changed: " ~ $input.reason
              }
            } as $expired_consent
          }
        }
      
        // 4. Update customer_booking clearing active quote and incrementing version
        db.edit customer_booking {
          field_name = "id"
          field_value = $booking.id
          data = {
            active_quote_id: null
            version        : $new_version
            updated_at     : "now"
          }
        } as $updated_booking
      }
    }
  }

  response = {
    invalidated: true
    booking_id : $input.booking_id
    new_version: $new_version
  }

  guid = "cDyv2Os7uHvKFcfXxgCwql7_eaA"
}
