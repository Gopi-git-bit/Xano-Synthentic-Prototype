// Current active identity required. Never return historical metadata or arbitrary event names.
query "logs/user/my_events" verb=GET {
  api_group = "Event Logs"
  auth = "user"

  input {
    int page?=1 filters=min:1|max:10000
    int per_page?=25 filters=min:1|max:100
  }

  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
  
    db.query event_log {
      where = $db.event_log.user_id == $context.user_id && ($db.event_log.action == "login" || $db.event_log.action == "signup" || $db.event_log.action == "get_auth_user" || $db.event_log.action == "reset_password" || $db.event_log.action == "login_for_password_reset" || $db.event_log.action == "welcome_email_queued" || $db.event_log.action == "welcome_email_sent" || $db.event_log.action == "event")
      sort = {created_at: "desc", id: "desc"}
      return = {
        type  : "list"
        paging: {
          page    : $input.page
          per_page: $input.per_page
          totals  : true
        }
      }
    
      output = [
        "curPage"
        "nextPage"
        "items.id"
        "items.created_at"
        "items.action"
      ]
    } as $events
  }

  response = $events
  tags = ["xano:quick-start"]
  guid = "CcBtnd_m1N_eGR5EGBNVc-_16bg"
}
