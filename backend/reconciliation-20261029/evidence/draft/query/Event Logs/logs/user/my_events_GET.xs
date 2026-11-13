// Pull paginated event logs for the authenticated user with explicit field projection
query "logs/user/my_events" verb=GET {
  api_group = "Event Logs"
  auth = "user"

  input {
    int page?=1 filters=min:1
    int per_page?=25 filters=min:1|max:100
  }

  stack {
    // Retrieve paginated event logs for the authenticated user, newest first
    db.query event_log {
      where = $db.event_log.user_id == $auth.id
      sort = {created_at: "desc"}
      return = {
        type  : "list"
        paging: {
          page    : $input.page
          per_page: $input.per_page
          totals  : true
        }
      }
    
      output = ["id", "created_at", "action", "metadata"]
    } as $user_events
  }

  response = $user_events
  tags = ["xano:quick-start"]
  guid = "CcBtnd_m1N_eGR5EGBNVc-_16bg"
}
