// Customer-only tenant-scoped list. No operational, contact or financial detail projection.
query bookings verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int page?=1 filters=min:1|max:10000
    int per_page?=20 filters=min:1|max:100
    enum? status? {
      values = [
        "draft"
        "quoted"
        "booked"
        "assigned"
        "in_transit"
        "delivered"
        "completed"
        "cancelled"
      ]
    }
  
    int? requested_org_id?
  }

  stack {
    function.run "security/resolve_context" {
      input = {
        user_id         : $auth.id
        requested_org_id: $input.requested_org_id
      }
    } as $context
  
    precondition ($context.can_read_bookings) {
      error_type = "accessdenied"
      error = "Customer booking scope required."
    }
  
    db.query customer_booking {
      where = $db.customer_booking.customer_organization_id == $context.organization_id && $db.customer_booking.status ==? $input.status
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
        "items.booking_reference"
        "items.customer_organization_id"
        "items.status"
        "items.payment_status"
        "items.payment_mode"
        "items.pickup_city"
        "items.delivery_city"
        "items.version"
      ]
    } as $bookings
  }

  response = $bookings
  guid = "6GSLqxIQiJCrqkSCjCvpgWtlp74"
}
