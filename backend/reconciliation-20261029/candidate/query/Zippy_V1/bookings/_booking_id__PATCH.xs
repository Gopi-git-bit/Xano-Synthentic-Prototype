query "bookings/{booking_id}" verb=PATCH {
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
  guid = "eZJf-oxiWY24O97XjWNAAJ51m9s"
}
