query "bookings/{booking_id}/holds" verb=POST {
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
  guid = "ExxOI7aHk30DdUsNzYPgWhQbkog"
}
