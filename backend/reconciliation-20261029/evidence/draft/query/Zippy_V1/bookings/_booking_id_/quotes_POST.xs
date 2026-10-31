// Generates an immutable corridor pricing quote for a customer booking
query "bookings/{booking_id}/quotes" verb=POST {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    // Unique booking ID
    int booking_id {
      table = "customer_booking"
    }
  
    // Optional requested vehicle body type
    text? vehicle_type_requested filters=trim
  
    // Optional commercial discount requested in minor units
    decimal? discount_minor_requested filters=min:0
  }

  stack {
    // 1. Fetch booking record
    db.get customer_booking {
      field_name = "id"
      field_value = $input.booking_id
      output = ["id", "customer_organization_id", "status"]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    // 2. Authorize caller
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $auth.id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "quote"
      }
    } as $auth_res
  
    // 3. Calculate immutable quote
    function.run "pricing/calculate_quote" {
      input = {
        booking_id              : $booking.id
        vehicle_type_requested  : $input.vehicle_type_requested
        discount_minor_requested: $input.discount_minor_requested
      }
    } as $quote_result
  }

  response = $quote_result
  middleware = {post: [{name: "Zippy_request_guard"}]}
  guid = "gmvLx0cis9Y9-SHdhdReeLEoPsU"
}
