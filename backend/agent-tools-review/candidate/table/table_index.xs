// Master migration manifest, relational dependency sequence, and schema reconciliation catalog
table table_index {
  auth = false

  schema {
    int id
  
    // Relational dependency load sequence (1, 2, 3...)
    int import_order?
  
    // Target Xano table name
    text table_name? filters=trim
  
    // Source CSV file name if populated from data import
    text csv_file? filters=trim
  
    // System origin: core_schema, synthetic_prototype, legacy_odoo, legacy_temporal
    text origin? filters=trim
  
    // Reference section in architectural specification or PRD
    text spec_sql_section? filters=trim
  
    // Foreign keys and relationship column mapping specification
    text relationship_columns? filters=trim
  
    // Migration & reconciliation status: reconciled, pending, deprecated
    text reconciliation_status? filters=trim
  
    // Technical architecture notes and integrity constraints
    text notes? filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "table_name"}]}
    {type: "btree", field: [{name: "import_order"}]}
    {type: "btree", field: [{name: "reconciliation_status"}]}
  ]

  guid = "oYas5-2mxXMyMgMgrzYJE7LMlak"
}
