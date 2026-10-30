// SANITIZED SOURCE REVIEW COPY — NOT DEPLOYABLE; GUID deliberately omitted.
// Original private Git history and GUID assignments remain unchanged.
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
  // Endpoint GUID intentionally omitted from public review.
}
