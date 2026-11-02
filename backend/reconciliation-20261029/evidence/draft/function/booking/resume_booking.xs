// Re-evaluates all domain gates after holds are cleared and restores booking to legal operational status
function "booking/resume_booking" {
  input {
    // Target booking ID
    int booking_id {
      table = "customer_booking"
    }
  
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
        "payment_status"
        "active_quote_id"
        "quote_amount"
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
        action_name             : "resume"
      }
    } as $auth_res
  
    // 3. Verify ALL active holds are cleared
    db.query order_holds {
      where = $db.order_holds.order_id == $booking.id && $db.order_holds.is_active == true
      return = {type: "list"}
      output = ["id", "reason_code", "scope"]
    } as $remaining_holds
  
    precondition (($remaining_holds|count) == 0) {
      error_type = "badrequest"
      error = "Cannot resume booking: remaining blocking holds are still active on this order."
    }
  
    // 4. Re-evaluate active quote validity
    var $quote_valid {
      value = false
    }
  
    conditional {
      if ($booking.active_quote_id != null) {
        db.query booking_quote {
          where = $db.booking_quote.quote_id == $booking.active_quote_id
          return = {type: "single"}
          output = ["id", "expires_at", "is_accepted"]
        } as $quote
      
        conditional {
          if ($quote != null && $quote.is_accepted && $quote.expires_at > now) {
            var.update $quote_valid {
              value = true
            }
          }
        }
      }
    }
  
    // 5. Determine next legal operational state
    var $next_status {
      value = "draft"
    }
  
    conditional {
      if ($quote_valid) {
        // Check if payment gate is also satisfied
        var $payment_satisfied {
          value = false
        }
      
        conditional {
          if ($booking.payment_mode == "prepaid" && $booking.payment_status == "paid_escrow") {
            var.update $payment_satisfied {
              value = true
            }
          }
        
          elseif ($booking.payment_mode == "topay") {
            db.query topay_consent_attempts {
              where = $db.topay_consent_attempts.order_id == $booking.id && $db.topay_consent_attempts.decision == "accepted" && $db.topay_consent_attempts.expires_at > now
              return = {type: "list"}
              output = ["id"]
            } as $accepted_consents
          
            conditional {
              if (($accepted_consents|count) > 0) {
                var.update $payment_satisfied {
                  value = true
                }
              }
            }
          }
        }
      
        conditional {
          if ($payment_satisfied) {
            var.update $next_status {
              value = "booked"
            }
          }
        
          else {
            var.update $next_status {
              value = "quoted"
            }
          }
        }
      }
    
      elseif ($booking.quote_amount > 0) {
        var.update $next_status {
          value = "quoted"
        }
      }
    }
  
    var $next_version {
      value = ($booking.version ?? 1) + 1
    }
  
    // 6. Update booking state
    db.edit customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = {
        status    : $next_status
        version   : $next_version
        updated_at: "now"
      }
    } as $upd_b
  
    // 7. Audit log (RESUMED operational transition event)
    db.add audit_log {
      data = {
        created_at    : "now"
        entity_type   : "customer_booking"
        entity_id     : $booking.id
        action        : "booking.resumed"
        actor_type    : "user"
        actor_id      : $input.caller_user_id
        previous_state: {status: $booking.status}
        new_state     : {status: $next_status, version: $next_version}
      }
    } as $audit_rec
  }

  response = {
    resumed    : true
    booking_id : $booking.id
    status     : $next_status
    version    : $next_version
    quote_valid: $quote_valid
  }

  guid = "1sQLCnIOiOTv0RequwCOOZDqPcE"
}
