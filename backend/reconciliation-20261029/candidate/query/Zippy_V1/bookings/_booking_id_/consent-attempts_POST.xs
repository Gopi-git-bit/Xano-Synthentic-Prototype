query "bookings/{booking_id}/consent-attempts" verb=POST {
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
  guid = "-raPARoSzPQN1Eju67GxKXMjY68"
}
