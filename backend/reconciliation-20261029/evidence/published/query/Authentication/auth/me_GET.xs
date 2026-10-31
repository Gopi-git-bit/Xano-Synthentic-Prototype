// Authoritative, side-effect-free identity; rechecks status and membership on every request.
query "auth/me" verb=GET {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
  }

  response = {
    id                    : $context.user_id
    name                  : $context.name
    email                 : $context.email
    system_role           : $context.system_role
    status                : $context.user_status
    active_organization_id: $context.organization_id
  }

  tags = ["xano:quick-start"]
  guid = "dhAy6uzAP6VInZUo3NUpseXZVUk"
}
