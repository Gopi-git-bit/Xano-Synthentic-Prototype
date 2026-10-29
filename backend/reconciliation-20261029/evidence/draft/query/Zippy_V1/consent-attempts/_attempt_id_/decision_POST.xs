// Submits verified consignee ToPay consent decision via capability token or OTP challenge
query "consent-attempts/{attempt_id}/decision" verb=POST {
  api_group = "Zippy_V1"

  input {
    // Unique consent attempt UUID
    uuid attempt_id
  
    // Decision outcome: accepted or denied
    text decision filters=trim|lower
  
    // Verification code sent via SMS
    text? verification_code filters=trim
  
    // Scoped capability token
    text? capability_token filters=trim
  
    // Reason if consent was denied
    text? denial_reason filters=trim
  
    // Audit evidence
    json? evidence
  
    // Optional client idempotency key
    text? idempotency_key filters=trim
  }

  stack {
    // 1. Idempotency validation
    var $cmd_payload {
      value = {
        attempt_id       : $input.attempt_id
        decision         : $input.decision
        capability_token : $input.capability_token
        verification_code: $input.verification_code
      }
    }
  
    function.run "security/validate_command" {
      input = {
        caller_user_id  : 0
        caller_org_id   : 0
        idempotency_key : $input.idempotency_key
        operation_scope : "topay.consent_decision"
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
  
    // 2. Execute domain service
    function.run "booking/record_consent_decision" {
      input = {
        attempt_id       : $input.attempt_id
        decision         : $input.decision
        verification_code: $input.verification_code
        capability_token : $input.capability_token
        denial_reason    : $input.denial_reason
        evidence         : $input.evidence
      }
    } as $result
  
    // 3. Complete idempotency
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
  guid = "KW_lQ0G930yx0BYgu5p3AAhT34E"
}
