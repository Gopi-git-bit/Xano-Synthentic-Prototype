// Lists customer bookings with strict tenant-scoped filtering and bounded pagination
query bookings verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    // Page number
    int page?=1 filters=min:1
  
    // Page size limit
    int per_page?=20 filters=min:1|max:100
  
    // Optional status filter
    text? status filters=trim|lower
  
    // Optional organization selector
    int? requested_org_id
  }

  stack {
    // 1. Resolve caller security context
    function.run "security/resolve_context" {
      input = {
        user_id         : $auth.id
        requested_org_id: $input.requested_org_id
      }
    } as $caller_ctx
  
    precondition ($caller_ctx.organization_id != null || $caller_ctx.is_platform_admin) {
      error_type = "accessdenied"
      error = "Active organization membership required to view freight bookings."
    }
  
    // 2. Query bookings strictly scoped to caller's active organization using null-safe ==?
    conditional {
      if ($caller_ctx.is_platform_admin) {
        db.query customer_booking {
          where = $db.customer_booking.status ==? $input.status
          sort = {created_at: "desc"}
          return = {
            type  : "list"
            paging: {
              page    : $input.page
              per_page: $input.per_page
              totals  : true
            }
          }
        
          output = [
            "id"
            "booking_reference"
            "customer_organization_id"
            "status"
            "payment_status"
            "payment_mode"
            "pickup_city"
            "delivery_city"
            "pickup_window_start"
            "delivery_window_end"
            "quote_amount"
            "total_amount"
            "currency"
            "version"
            "created_at"
          ]
        } as $bookings
      }
    
      else {
        db.query customer_booking {
          where = $db.customer_booking.customer_organization_id == $caller_ctx.organization_id && $db.customer_booking.status ==? $input.status
          sort = {created_at: "desc"}
          return = {
            type  : "list"
            paging: {
              page    : $input.page
              per_page: $input.per_page
              totals  : true
            }
          }
        
          output = [
            "id"
            "booking_reference"
            "customer_organization_id"
            "status"
            "payment_status"
            "payment_mode"
            "pickup_city"
            "delivery_city"
            "pickup_window_start"
            "delivery_window_end"
            "quote_amount"
            "total_amount"
            "currency"
            "version"
            "created_at"
          ]
        } as $bookings
      }
    }
  }

  response = $bookings
  middleware = {post: [{name: "Zippy_request_guard"}]}
  guid = "6GSLqxIQiJCrqkSCjCvpgWtlp74"
}
