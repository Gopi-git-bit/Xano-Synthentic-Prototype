query "bookings/{booking_id}/quotes/{quote_id}/accept" verb=POST {
  api_group = "Zippy_V1"
  auth = "user"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Booking mutations are unavailable pending release review."
    }
  }

  response = null
  guid = "VmrJkp73XerYTSIYvnpY5rotaMs"
}
