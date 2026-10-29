// Records a verified consignee ToPay consent decision (accepted vs denied) using OTP or capability token
function "booking/record_consent_decision" {
  input {
    // Unique consent attempt UUID
    uuid attempt_id
  
    // Decision outcome
    text decision filters=trim|lower
  
    // Optional 6-digit verification code
    text? verification_code filters=trim
  
    // Scoped capability token
    text? capability_token filters=trim
  
    // Justification if consent was denied
    text? denial_reason filters=trim
  
    // Client verification evidence
    json? evidence
  }

  stack {
    // 1. Fetch consent attempt
    db.query topay_consent_attempts {
      where = $db.topay_consent_attempts.consent_attempt_id == $input.attempt_id
      return = {type: "single"}
      output = [
        "id"
        "consent_attempt_id"
        "order_id"
        "decision"
        "expires_at"
        "quote_hash"
        "challenge_id"
        "capability_token"
      ]
    } as $attempt
  
    precondition ($attempt != null) {
      error_type = "notfound"
      error = "Consent attempt record not found."
    }
  
    // 2. Validate attempt is pending and unexpired
    precondition ($attempt.decision == "pending") {
      error_type = "badrequest"
      error = "Consent attempt has already been resolved or expired."
    }
  
    precondition ($attempt.expires_at > now) {
      error_type = "badrequest"
      error = "Consent attempt has expired. A new consent request must be initiated."
    }
  
    // 3. Verify capability token OR OTP challenge code
    var $authorized {
      value = false
    }
  
    conditional {
      if ($input.capability_token != null) {
        precondition ($input.capability_token == $attempt.capability_token) {
          error_type = "accessdenied"
          error = "Invalid consent capability token."
        }
      
        var.update $authorized {
          value = true
        }
      }
    
      elseif ($input.verification_code != null) {
        db.query otp_challenges {
          where = $db.otp_challenges.challenge_id == $attempt.challenge_id
          return = {type: "single"}
          output = ["id", "code_hash", "is_consumed", "expires_at"]
        } as $otp
      
        precondition ($otp != null && $otp.is_consumed == false && $otp.expires_at > now) {
          error_type = "badrequest"
          error = "OTP challenge has expired or has already been consumed."
        }
      
        var $input_hash {
          value = $input.verification_code|sha256
        }
      
        precondition ($input_hash == $otp.code_hash) {
          error_type = "accessdenied"
          error = "Invalid OTP code provided."
        }
      
        // Atomically consume OTP challenge
        db.edit otp_challenges {
          field_name = "id"
          field_value = $otp.id
          data = {is_consumed: true, consumed_at: "now"}
        } as $consumed_otp
      
        var.update $authorized {
          value = true
        }
      }
    }
  
    precondition ($authorized) {
      error_type = "accessdenied"
      error = "Valid capability_token or verification_code is required to record consent."
    }
  
    // 4. Validate decision parameter
    precondition ($input.decision == "accepted" || $input.decision == "denied") {
      error_type = "badrequest"
      error = "Invalid decision parameter. Must be 'accepted' or 'denied'."
    }
  
    // 5. If accepted, verify quote terms have not been modified or expired
    conditional {
      if ($input.decision == "accepted") {
        db.get customer_booking {
          field_name = "id"
          field_value = $attempt.order_id
          output = ["id", "active_quote_id", "version"]
        } as $booking
      
        precondition ($booking != null && $booking.active_quote_id != null) {
          error_type = "badrequest"
          error = "No active quote attached to booking."
        }
      
        db.query booking_quote {
          where = $db.booking_quote.quote_id == $booking.active_quote_id
          return = {type: "single"}
          output = ["input_hash", "expires_at", "is_accepted"]
        } as $quote
      
        precondition ($quote != null && $quote.expires_at > now && $quote.is_accepted) {
          error_type = "badrequest"
          error = "Quote has expired or is invalid. Cannot consent to expired quote."
        }
      
        precondition ($quote.input_hash == $attempt.quote_hash) {
          error_type = "badrequest"
          error = "Booking specifications were modified since consent was requested. Please request new consent."
        }
      }
    }
  
    // 6. Record decision
    db.edit topay_consent_attempts {
      field_name = "id"
      field_value = $attempt.id
      data = {
        decision     : $input.decision
        decided_at   : "now"
        denial_reason: $input.denial_reason
        evidence     : $input.evidence
      }
    } as $updated_attempt
  
    // 7. Audit log
    db.add audit_log {
      data = {
        created_at : "now"
        entity_type: "topay_consent_attempt"
        entity_id  : $attempt.order_id
        action     : "topay.decision_recorded"
        actor_type : "user"
        new_state  : {
        attempt_id: $attempt.consent_attempt_id
        decision  : $input.decision
        reason    : $input.denial_reason
      }
      }
    } as $audit_rec
  }

  response = {
    attempt_id: $attempt.consent_attempt_id
    booking_id: $attempt.order_id
    decision  : $input.decision
    decided_at: "now"
  }

  guid = "ap1057RIDD2gZxZ3dUtutCH-ki8"
}
