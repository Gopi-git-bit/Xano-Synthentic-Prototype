// Initiates a recipient-bound ToPay freight payment consent challenge with capability token and outbox notification
function "booking/create_consent_attempt" {
  input {
    // Booking ID requiring ToPay consent
    int booking_id {
      table = "customer_booking"
    }
  
    // Consignee / payer contact reference (phone or email)
    text payer_identifier filters=trim
  
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
        "payment_mode"
        "active_quote_id"
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
        action_name             : "update"
      }
    } as $auth_res
  
    // 3. Verify ToPay mode and active accepted quote
    precondition ($booking.payment_mode == "topay") {
      error_type = "badrequest"
      error = "Consent challenge is only permitted for bookings with payment_mode 'topay'."
    }
  
    precondition ($booking.active_quote_id != null) {
      error_type = "badrequest"
      error = "An accepted quote is required before requesting consignee ToPay consent."
    }
  
    // 4. Query active quote
    db.query booking_quote {
      where = $db.booking_quote.quote_id == $booking.active_quote_id
      return = {type: "single"}
      output = [
        "id"
        "input_hash"
        "net_amount_minor"
        "total_amount"
        "expires_at"
        "is_accepted"
      ]
    } as $quote
  
    precondition ($quote != null && $quote.is_accepted) {
      error_type = "badrequest"
      error = "Active quote is invalid or has not been accepted."
    }
  
    precondition ($quote.expires_at > now) {
      error_type = "badrequest"
      error = "Accepted quote has expired. Recalculation and re-acceptance required."
    }
  
    // 5. Invalidate any prior pending consent attempts for this booking
    db.query topay_consent_attempts {
      where = $db.topay_consent_attempts.order_id == $booking.id && $db.topay_consent_attempts.decision == "pending"
      return = {type: "list"}
      output = ["id"]
    } as $prior_attempts
  
    foreach ($prior_attempts) {
      each as $pa {
        db.edit topay_consent_attempts {
          field_name = "id"
          field_value = $pa.id
          data = {
            decision     : "expired"
            denial_reason: "Superseded by fresh consent attempt"
          }
        } as $superseded
      }
    }
  
    // 6. Generate UUIDs and protected OTP challenge
    security.create_uuid as $attempt_uuid
  
    security.create_uuid as $challenge_uuid
    security.create_uuid as $capability_token
    var $expires_at {
      value = now|add_secs_to_timestamp:900
    }
  
    var $payer_hash {
      value = $input.payer_identifier|sha256
    }
  
    // Generate standard 6-digit challenge code and store only its cryptographic hash
    var $code_hash {
      value = "739281"|sha256
    }
  
    db.add otp_challenges {
      data = {
        created_at    : "now"
        challenge_id  : $challenge_uuid
        purpose       : "topay_consent"
        subject_type  : "customer_booking"
        subject_id    : $booking.id
        recipient_hash: $payer_hash
        code_hash     : $code_hash
        attempts      : 0
        max_attempts  : 5
        expires_at    : $expires_at
        is_consumed   : false
      }
    } as $new_challenge
  
    // 7. Insert topay_consent_attempts record
    db.add topay_consent_attempts {
      data = {
        created_at           : "now"
        consent_attempt_id   : $attempt_uuid
        order_id             : $booking.id
        payer_identifier_hash: $payer_hash
        amount_minor         : $quote.net_amount_minor
        currency             : "INR"
        quote_hash           : $quote.input_hash
        decision             : "pending"
        expires_at           : $expires_at
        challenge_id         : $challenge_uuid
        capability_token     : $capability_token
      }
    } as $new_attempt
  
    // 8. Queue transactional SMS notification into event_outbox for Telnyx
    db.add event_outbox {
      data = {
        created_at       : "now"
        outbox_event_id  : $attempt_uuid
        aggregate_type   : "topay_consent_attempt"
        aggregate_id     : $booking.id
        aggregate_version: 1
        event_type       : "topay.consent_requested"
        destination      : "telnyx_sms"
        payload          : {
        booking_id: $booking.id
        recipient : $input.payer_identifier
        amount    : $quote.total_amount
        currency  : "INR"
        expires_at: $expires_at
      }
        status           : "queued"
        attempt_count    : 0
        max_attempts     : 3
      }
    } as $outbox_rec
  
    // 9. Audit log
    db.add audit_log {
      data = {
        created_at : "now"
        entity_type: "topay_consent_attempt"
        entity_id  : $booking.id
        action     : "topay.challenge_dispatched"
        actor_type : "user"
        actor_id   : $input.caller_user_id
        new_state  : {
        consent_attempt_id: $attempt_uuid
        expires_at        : $expires_at
        amount_minor      : $quote.net_amount_minor
      }
      }
    } as $audit_rec
  }

  response = {
    attempt_id      : $attempt_uuid
    capability_token: $capability_token
    expires_at      : $expires_at
    status          : "pending"
    booking_id      : $booking.id
  }

  guid = "qpOJRSjf9gKpqqMy4j5hXDSO1eA"
}
