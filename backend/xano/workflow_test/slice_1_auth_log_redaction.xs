workflow_test "Slice1 auth log redaction" {
  stack {
    function.call "Slice1/setup" as $setup
    db.get user {
      field_name = "email"
      field_value = "s1-61aa324d-a@example.invalid"
      output = ["id"]
    } as $actor
  
    function.call "Quick Start/log_event" {
      input = {
        user_id : $actor.id
        action  : "synthetic_redaction_61aa324d"
        metadata: {
        password   : "synthetic-do-not-store"
        magic_token: "synthetic-token"
        email      : "synthetic@example.invalid"
      }
      }
    } as $logged
  
    db.query event_log {
      where = $db.event_log.user_id == $actor.id && $db.event_log.action == "synthetic_redaction_61aa324d"
      return = {type: "single"}
    } as $event
  
    expect.to_equal ($event.metadata) {
      value = {user_id: $actor.id}
    }
  }

  tags = ["synthetic:slice1", "auth:redaction"]
  guid = "VR7lB7aaBMfFthmdxx4pJ0-mM1Q"
}