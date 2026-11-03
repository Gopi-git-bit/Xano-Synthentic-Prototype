// Resolve permissions before a tenant-scoped lookup; missing and foreign IDs have the same response.
query "bookings/{booking_id}" verb=GET {
  api_group = "Customer Draft Bookings"
  auth = "user"

  input {
    int booking_id filters=min:1 {
      table = "customer_booking"
    }
  }

  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
  
    precondition ($context.can_read_bookings) {
      error_type = "accessdenied"
      error = "Customer booking scope required."
    }
  
    db.query customer_booking {
      where = $db.customer_booking.id == $input.booking_id && $db.customer_booking.customer_organization_id == $context.organization_id
      return = {type: "single"}
      output = [
        "id"
        "booking_reference"
        "customer_organization_id"
        "status"
        "payment_status"
        "payment_mode"
        "pickup_city"
        "delivery_city"
        "version"
      ]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $auth.id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "read"
      }
    } as $authorized
  
    db.query cargo_detail {
      where = $db.cargo_detail.booking_id == $booking.id
      return = {type: "list"}
      output = ["id"]
    } as $cargo
  
    db.query order_holds {
      where = $db.order_holds.order_id == $booking.id && $db.order_holds.is_active == true
      return = {type: "list"}
      output = ["id"]
    } as $holds
  }

  response = {
    booking         : $booking
    cargo           : $cargo
    active_holds    : $holds
    blocking_reasons: ["Operational booking commands are unavailable in this isolated draft milestone."]
    allowed_actions : []
  }

  guid = "TIM8wNAjymPpkdQFVbENQWCVzcQ"
}
