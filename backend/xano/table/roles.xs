// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table roles {
  auth = false

  schema {
    int id
    text role_code
    text description
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "role_code"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "hXgHi3D8gJqxB6kL1PExNrM45AM"
}