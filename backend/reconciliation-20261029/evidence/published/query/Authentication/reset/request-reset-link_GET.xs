// Review candidate: onboarding/recovery remains unavailable pending an approved independent flow.
query "reset/request-reset-link" verb=GET {
  api_group = "Authentication"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account onboarding or recovery is unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "bYr4JVjrEejdcUEIsYdGAlUrVR0"
}
