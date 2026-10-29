// Retrieves projected booking details, itemized cargo, allowed actions, and blocking reasons
query "bookings/{booking_id}" verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    // Unique booking ID
    int booking_id {
      table = "customer_booking"
    }
  }

  stack {
    // 1. Fetch booking record
    db.get customer_booking {
      field_name = "id"
      field_value = $input.booking_id
      output = [
        "id"
        "booking_reference"
        "customer_organization_id"
        "booked_by_user_id"
        "status"
        "payment_status"
        "payment_mode"
        "active_quote_id"
        "pickup_city"
        "pickup_address"
        "pickup_window_start"
        "pickup_window_end"
        "delivery_city"
        "delivery_address"
        "delivery_window_start"
        "delivery_window_end"
        "estimated_distance_km"
        "quote_amount"
        "total_amount"
        "currency"
        "consignee_details"
        "version"
        "created_at"
      ]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    // 2. Authorize caller against booking tenant
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $auth.id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "read"
      }
    } as $auth_res
  
    // 3. Fetch itemized cargo
    db.query cargo_detail {
      where = $db.cargo_detail.booking_id == $booking.id
      return = {type: "list"}
      output = [
        "id"
        "cargo_description"
        "commodity_type"
        "weight_kg"
        "volume_cbm"
        "package_count"
        "packaging_type"
        "is_hazardous"
        "un_number"
        "declared_value"
      ]
    } as $cargo_list
  
    // 4. Fetch active holds
    db.query order_holds {
      where = $db.order_holds.order_id == $booking.id && $db.order_holds.is_active == true
      return = {type: "list"}
      output = [
        "id"
        "hold_id"
        "scope"
        "reason_code"
        "description"
        "opened_at"
      ]
    } as $active_holds
  
    // 5. Evaluate blocking reasons
    var $blocking_reasons {
      value = []
    }
  
    conditional {
      if (($active_holds|count) > 0) {
        var.update $blocking_reasons {
          value = $blocking_reasons
            |push:"Active domain holds engaged on order"
        }
      }
    }
  
    conditional {
      if ($booking.active_quote_id == null) {
        var.update $blocking_reasons {
          value = $blocking_reasons|push:"No accepted pricing quote"
        }
      }
    }
  
    conditional {
      if ($booking.payment_mode == "prepaid" && $booking.payment_status != "paid_escrow") {
        var.update $blocking_reasons {
          value = $blocking_reasons
            |push:"Prepaid escrow payment pending"
        }
      }
    }
  
    // 6. Compute allowed actions
    var $allowed_actions {
      value = []
    }
  
    conditional {
      if ($booking.status == "draft" || $booking.status == "quoted") {
        var.update $allowed_actions {
          value = $allowed_actions|push:"calculate_quote"
        }
      
        var.update $allowed_actions {
          value = $allowed_actions|push:"select_payment_mode"
        }
      
        var.update $allowed_actions {
          value = $allowed_actions|push:"cancel"
        }
      }
    }
  
    conditional {
      if (($blocking_reasons|count) == 0 && ($booking.status == "draft" || $booking.status == "quoted")) {
        var.update $allowed_actions {
          value = $allowed_actions|push:"confirm"
        }
      }
    }
  }

  response = {
    booking         : $booking
    cargo           : $cargo_list
    active_holds    : $active_holds
    blocking_reasons: $blocking_reasons
    allowed_actions : $allowed_actions
  }

  middleware = {post: [{name: "Zippy_request_guard"}]}
  guid = "TIM8wNAjymPpkdQFVbENQWCVzcQ"
}
