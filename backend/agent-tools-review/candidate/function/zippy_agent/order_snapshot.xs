// Read-only validation of stored order, cargo, quote, payment, and hold evidence. No state transitions.
function "zippy_agent/order_snapshot" {
  input {
    json booking
  }
  stack {
    var $reasons { value = [] }
    var $total_weight_kg { value = 0 }
    var $total_volume_cbm { value = 0 }
    var $temperature_control { value = false }
    var $hazardous { value = false }
    db.query cargo_detail {
      where = $db.cargo_detail.booking_id == $input.booking.id
      return = {type: "list"}
      output = ["id", "weight_kg", "volume_cbm", "package_count", "is_hazardous", "requires_temperature_control"]
    } as $cargo
    
    conditional {
      if (($cargo|count) == 0) {
        var.update $reasons { value = $reasons|push:"CARGO_MISSING" }
      }
    }
    foreach ($cargo) {
      each as $item {
        
    conditional {
      if ($item.weight_kg == null || $item.weight_kg <= 0 || $item.package_count == null || $item.package_count < 1) {
        var.update $reasons { value = $reasons|push:"CARGO_INVALID" }
      }
    }
        
    conditional {
      if ($item.volume_cbm == null || $item.volume_cbm <= 0) {
        var.update $reasons { value = $reasons|push:"CARGO_VOLUME_UNVERIFIED" }
      }
    }
        math.add $total_weight_kg { value = $item.weight_kg }
        conditional {
          if ($item.volume_cbm != null) {
            math.add $total_volume_cbm { value = $item.volume_cbm }
          }
        }
        conditional {
          if ($item.requires_temperature_control) {
            var.update $temperature_control { value = true }
          }
        }
        conditional {
          if ($item.is_hazardous) {
            var.update $hazardous { value = true }
          }
        }
      }
    }
    
    conditional {
      if ($input.booking.pickup_city == "" || $input.booking.delivery_city == "") {
        var.update $reasons { value = $reasons|push:"ROUTE_INCOMPLETE" }
      }
    }
    
    conditional {
      if ($input.booking.estimated_distance_km == null || $input.booking.estimated_distance_km <= 0) {
        var.update $reasons { value = $reasons|push:"DISTANCE_UNVERIFIED" }
      }
    }
    
    conditional {
      if ($input.booking.pickup_window_start == null || $input.booking.pickup_window_end == null || $input.booking.delivery_window_start == null || $input.booking.delivery_window_end == null) {
        var.update $reasons { value = $reasons|push:"TIME_WINDOW_MISSING" }
      }
    }
    
    conditional {
      if ($input.booking.pickup_window_start >= $input.booking.pickup_window_end || $input.booking.delivery_window_start >= $input.booking.delivery_window_end || $input.booking.delivery_window_start < $input.booking.pickup_window_end || $input.booking.pickup_window_start <= now) {
        var.update $reasons { value = $reasons|push:"TIME_WINDOW_INVALID" }
      }
    }
    
    conditional {
      if ($input.booking.status != "booked") {
        var.update $reasons { value = $reasons|push:"BOOKING_NOT_CONFIRMED" }
      }
    }
    
    conditional {
      if ($input.booking.payment_mode != "prepaid") {
        var.update $reasons { value = $reasons|push:"PAYMENT_MODE_REQUIRES_MANUAL_REVIEW" }
      }
    }
    
    conditional {
      if ($input.booking.payment_status != "paid_escrow" && $input.booking.payment_status != "settled") {
        var.update $reasons { value = $reasons|push:"PAYMENT_NOT_CONFIRMED" }
      }
    }
    db.query order_holds {
      where = $db.order_holds.order_id == $input.booking.id && $db.order_holds.is_active == true
      return = {type: "count"}
    } as $active_holds
    
    conditional {
      if ($active_holds > 0) {
        var.update $reasons { value = $reasons|push:"ACTIVE_HOLD" }
      }
    }
    var $quote { value = null }
    conditional {
      if ($input.booking.active_quote_id != null) {
        db.query booking_quote {
          where = $db.booking_quote.quote_id == $input.booking.active_quote_id && $db.booking_quote.booking_id == $input.booking.id
          return = {type: "single"}
          output = ["quote_id", "booking_id", "booking_version", "vehicle_type", "currency", "total_amount", "is_accepted", "expires_at"]
        } as $quote_row
        var.update $quote { value = $quote_row }
      }
    }
    conditional {
      if ($quote == null) {
        var.update $reasons { value = $reasons|push:"QUOTE_MISSING_OR_UNRELATED" }
      }
      else {
        
    conditional {
      if ($quote.is_accepted != true || $quote.expires_at <= now) {
        var.update $reasons { value = $reasons|push:"QUOTE_NOT_ACCEPTED_OR_EXPIRED" }
      }
    }
        
    conditional {
      if ($quote.booking_version != $input.booking.version) {
        var.update $reasons { value = $reasons|push:"QUOTE_VERSION_MISMATCH" }
      }
    }
        
    conditional {
      if ($quote.currency != $input.booking.currency || $quote.total_amount != $input.booking.total_amount || $quote.total_amount <= 0) {
        var.update $reasons { value = $reasons|push:"QUOTE_AMOUNT_MISMATCH" }
      }
    }
      }
    }
  }
  response = {valid: ($reasons|count) == 0, reason_codes: $reasons, booking_id: $input.booking.id, version: $input.booking.version, total_weight_kg: $total_weight_kg, total_volume_cbm: $total_volume_cbm, requires_temperature_control: $temperature_control, is_hazardous: $hazardous, quote: $quote, active_hold_count: $active_holds, checked_at: now, execution_enabled: false}
  guid = "3FLz9Qu-UEMW7RuQUP_toXN3HKM"
}
