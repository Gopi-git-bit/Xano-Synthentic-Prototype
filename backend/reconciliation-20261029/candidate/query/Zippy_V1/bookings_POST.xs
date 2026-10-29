// Local review candidate: refuse writes until independently verified and released.
query bookings verb=POST {
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
  guid = "YBEzcApCI-ywnoCzLNNmFhnaDGU"
}
