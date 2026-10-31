// Carrier vendor payout settlements, platform commission deduction, TDS taxes, and disbursement records
table settlement {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Unique settlement reference code (e.g., ZIP-SET-2025-0001)
    text settlement_reference filters=trim|upper
  
    // Completed freight transport trip
    int trip_id {
      table = "trip"
    }
  
    // Carrier vendor organization receiving disbursement
    int vendor_organization_id {
      table = "organization"
    }
  
    // Gross freight rate agreed for haul
    decimal gross_carrier_amount filters=min:0
  
    // Zippy platform brokerage / matchmaking commission fee
    decimal platform_fee filters=min:0
  
    // Tax Deducted at Source (TDS) or legal statutory withholding
    decimal tax_tds filters=min:0
  
    // Net disbursement amount payable to vendor bank account
    decimal net_payout_amount filters=min:0
  
    // Settlement currency
    text currency?=INR filters=trim|upper
  
    // Carrier payout lifecycle standing (POD verification required before processing)
    enum status?=pending {
      values = [
        "pending"
        "pod_verified"
        "processing"
        "paid"
        "on_hold"
        "failed"
      ]
    
    }
  
    // Masked bank account / UPI VPA for settlement transfer
    text? bank_account_mask filters=trim
  
    // Banking payout batch / UTR transaction number
    text? payout_batch_reference filters=trim
  
    // Exact timestamp when funds were remitted to vendor bank
    timestamp? paid_at
  
    // Finance officer who authorized disbursement
    int? approved_by_user_id {
      table = "user"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "settlement_reference"}]
    }
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "vendor_organization_id"}]}
    {type: "btree", field: [{name: "status"}]}
  ]

  guid = "U6aetTkkDRNx1frAIpTIbNLiXHI"
}
