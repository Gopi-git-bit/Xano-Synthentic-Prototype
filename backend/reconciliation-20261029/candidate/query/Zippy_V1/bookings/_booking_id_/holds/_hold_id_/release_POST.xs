query "bookings/{booking_id}/holds/{hold_id}/release" verb=POST {
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
  guid = "bNqFkRnsiEgmCKPa4I3BoRtLpL8"
}
