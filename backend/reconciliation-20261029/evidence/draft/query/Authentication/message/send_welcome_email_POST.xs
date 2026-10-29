// Queues a transactional welcome notification for the authenticated user via event_outbox
query "message/send_welcome_email" verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
    // The ID of the user to send the welcome email to
    int user_id
  }

  stack {
    // Enforce ownership: user can only request email for themselves unless admin
    precondition ($auth.id == $input.user_id || $auth.role == "admin") {
      error_type = "accessdenied"
      error = "Unauthorized to send welcome email for another account."
    }
  
    // Retrieve the user record for the given user ID
    db.get user {
      field_name = "id"
      field_value = $input.user_id
      output = ["id", "name", "email"]
    } as $user_record
  
    // Ensure the user record exists before proceeding
    precondition ($user_record != null) {
      error_type = "notfound"
      error = "User not found."
    }
  
    // Queue transactional email delivery job into event_outbox for asynchronous Telnyx processing
    db.add event_outbox {
      data = {
        created_at       : "now"
        outbox_event_id  : $input.user_id|uuid
        aggregate_type   : "user"
        aggregate_id     : $user_record.id
        aggregate_version: 1
        event_type       : "user.welcome_email"
        destination      : "telnyx_email"
        payload          : {
        recipient_id   : $user_record.id
        recipient_email: $user_record.email
        recipient_name : $user_record.name
        template       : "welcome_onboarding"
      }
        status           : "queued"
        attempt_count    : 0
        max_attempts     : 3
      }
    } as $outbox_record
  
    // Log sanitized event
    function.run "Quick Start/log_event" {
      input = {
        user_id : $input.user_id
        action  : "welcome_email_queued"
        metadata: {user_id: $input.user_id, status: "queued"}
      }
    } as $event_log
  }

  response = {
    queued : true
    user_id: $input.user_id
    status : "queued_for_delivery"
  }

  tags = ["xano:quick-start"]
  guid = "olPklXlkadDR393PX2WElLYb72A"
}
