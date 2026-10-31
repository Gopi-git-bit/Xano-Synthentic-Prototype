// Disposable synthetic rollback evidence only.
table proof_rows {
  auth = false

  schema {
    int id
    uuid proof_id
    text reason
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "proof_id"}]}
  ]

  guid = "YumVCb_Ettun-rQjGItFAB4Lovg"
}
