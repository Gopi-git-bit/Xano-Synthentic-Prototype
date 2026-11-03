// Isolated authenticated review surface. No mutation or messaging tools are exposed.
mcp_server "Zippy Agent Tools Review" {
  canonical = "zippy-agent-review"
  instructions = "Read-only synthetic review environment. Every tool requires user authentication and enforces its own database roles and resource ownership."
  tags = ["zippy", "isolated-review", "read-only"]
  tools = [{name: "zippy_get_booking", auth: "user"}, {name: "zippy_validate_order", auth: "user"}, {name: "zippy_check_vehicle_eligibility", auth: "user"}, {name: "zippy_propose_assignment", auth: "user"}, {name: "zippy_review_pod", auth: "user"}, {name: "zippy_get_payment_summary", auth: "user"}, {name: "zippy_prescreen_refund", auth: "user"}]
  guid = "WOv6-fWvmFfBNfMOTkvWEGDCEjI"
}
