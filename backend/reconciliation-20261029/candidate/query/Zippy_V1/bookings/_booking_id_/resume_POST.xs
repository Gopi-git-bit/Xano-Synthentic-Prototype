query "bookings/{booking_id}/resume" verb=POST {
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
  guid = "iINhgTaUOWgnOGkcECxAK6jPrls"
}
