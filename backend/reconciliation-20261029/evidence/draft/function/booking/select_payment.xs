// Selects and binds approved freight payment mode (prepaid vs ToPay) with consignee validation
function "booking/select_payment" {
  input {
    // Booking ID being updated
    int booking_id {
      table = "customer_booking"
    }
  
    // Selected payment mode
    text payment_mode filters=trim|lower
  
    // Structured consignee details (required for ToPay mode)
    json? consignee_details
  
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
        action_name             : "update"
      }
    } as $auth_res
  
    // 3. Verify an accepted quote exists
    precondition ($booking.active_quote_id != null) {
      error_type = "badrequest"
      error = "An accepted quote is required before selecting payment mode."
    }
  
    // 4. Validate payment mode
    precondition ($input.payment_mode == "prepaid" || $input.payment_mode == "topay") {
      error_type = "badrequest"
      error = "Invalid payment mode. Supported modes: 'prepaid' or 'topay'."
    }
  
    // 5. If ToPay, require explicit consignee contact details
    conditional {
      if ($input.payment_mode == "topay") {
        precondition ($input.consignee_details != null && $input.consignee_details.phone != null) {
          error_type = "badrequest"
          error = "ToPay payment mode requires valid consignee recipient details with phone number."
        }
      }
    }
  
    var $next_version {
      value = ($booking.version ?? 1) + 1
    }
  
    // 6. Update booking payment selection and increment version
    db.edit customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = {
        payment_mode     : $input.payment_mode
        consignee_details: $input.consignee_details
        version          : $next_version
        updated_at       : "now"
      }
    } as $updated_b
  
    // 7. Audit log
    db.add audit_log {
      data = {
        created_at : "now"
        entity_type: "customer_booking"
        entity_id  : $booking.id
        action     : "booking.payment_mode_selected"
        actor_type : "user"
        actor_id   : $input.caller_user_id
        new_state  : {
        payment_mode: $input.payment_mode
        version     : $next_version
      }
      }
    } as $audit_rec
  }

  response = {
    booking_id  : $booking.id
    payment_mode: $input.payment_mode
    version     : $next_version
    status      : $booking.status
  }

  guid = "RfBtv_2R547Af0Lf2Px27LEgqZ8"
}
