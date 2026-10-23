// Customer-scoped read adapter; no client platform/profile override.
query "api/v1/orders" verb=GET {
  api_group = "Logistics"
  auth = "user"

  input {
    int page?=1 filters=min:1
    int per_page?=20 filters=min:1|max:100
  }

  stack {
    function.run "Logistics/resolve_identity" {
      input = {user_id: $auth.id}
    } as $identity
  
    precondition (($identity.roles|contains:"customer") && $identity.customer != null) {
      error_type = "accessdenied"
      error = "Actor is not authorized"
    }
  
    db.query orders {
      where = $db.orders.platform_id == $identity.platform_id && $db.orders.booking_customer_profile_id == $identity.customer.customer_profile_id
      sort = {orders.created_at: "desc"}
      return = {
        type  : "list"
        paging: {
          page    : $input.page
          per_page: $input.per_page
          totals  : true
        }
      }
    } as $orders
  }

  response = $orders
  tags = ["zippy:prototype"]
  guid = "4AIoWbh2wmT9lC7Jm44r6IWBxDs"
}