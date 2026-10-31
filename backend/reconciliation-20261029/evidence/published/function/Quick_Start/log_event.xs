// Minimal audit entry: no caller-supplied metadata is persisted.
function "Quick Start/log_event" {
  input {
    int user_id
    text action
    json metadata?
  }

  stack {
    var $safe_action {
      value = "event"
    }
  
    conditional {
      if ($input.action == "login" || $input.action == "signup" || $input.action == "get_auth_user" || $input.action == "reset_password" || $input.action == "login_for_password_reset" || $input.action == "welcome_email_queued") {
        var.update $safe_action {
          value = $input.action
        }
      }
    }
  
    db.add event_log {
      data = {
        created_at: "now"
        user_id   : $input.user_id
        action    : $safe_action
        metadata  : {}
      }
    } as $event
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "KcbNfC-kH9IWL9sKX1YYDBIaz9k"
}
