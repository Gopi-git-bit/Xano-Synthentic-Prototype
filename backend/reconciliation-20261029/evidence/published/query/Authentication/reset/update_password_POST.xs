// Review candidate: onboarding/recovery remains unavailable pending an approved independent flow.
query "reset/update_password" verb=POST {
  api_group = "Authentication"
  auth = "user"

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
  guid = "uLSQq0yQAcWE0FXguLV-LXqLtk4"
}
