// Creates a sanitized record in the event log table, stripping credentials and tokens
function "Quick Start/log_event" {
  input {
    // Unique identifier for the user who performed the action.
    int user_id
  
    // A description of the action performed by the user (e.g., 'login', 'created_invoice').
    text action
  
    // Additional data related to the event, such as resource IDs or old/new values.
    json metadata?
  }

  stack {
    var $clean_metadata {
      value = $input.metadata
    }
  
    // Enforce strict redaction of sensitive credentials and auth tokens
    conditional {
      if ($clean_metadata != null) {
        var.update $clean_metadata.password {
          value = null
        }
      
        var.update $clean_metadata.password_reset {
          value = null
        }
      
        var.update $clean_metadata.token {
          value = null
        }
      
        var.update $clean_metadata.magic_token {
          value = null
        }
      
        var.update $clean_metadata.secret {
          value = null
        }
      }
    }
  
    // Add a sanitized event log entry
    db.add event_log {
      data = {
        created_at: "now"
        user_id   : $input.user_id
        action    : $input.action
        metadata  : $clean_metadata
      }
    } as $new_log_entry
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "KcbNfC-kH9IWL9sKX1YYDBIaz9k"
}
