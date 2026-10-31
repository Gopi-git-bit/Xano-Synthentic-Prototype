query "consent-attempts/{attempt_id}/decision" verb=POST {
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
  guid = "KW_lQ0G930yx0BYgu5p3AAhT34E"
}
