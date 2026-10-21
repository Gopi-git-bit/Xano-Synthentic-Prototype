query "api/v1/accounts/me" verb=GET {
  api_group = "Logistics"
  auth = "user"

  input {
  }

  stack {
    function.run "Logistics/resolve_identity" {
      input = {user_id: $auth.id}
    } as $identity
  }

  response = {
    account_id : $identity.account_id
    platform_id: $identity.platform_id
    status     : $identity.account_status
    roles      : $identity.roles
  }

  tags = ["zippy:prototype"]
  guid = "wHDGQ0InbYslwdF3ZagZttn6tAQ"
}