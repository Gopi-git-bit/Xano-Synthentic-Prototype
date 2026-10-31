// Notifications are outside the approved-account read release; deny before any side effect.
query "message/send_welcome_email" verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account notifications are unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "olPklXlkadDR393PX2WElLYb72A"
}
