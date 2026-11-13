function "M1Execution/catalog" {
  input {}
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }

    db.direct_query {
      sql = """
        SELECT json_build_object(
          'database',current_database(),
          'tables',(SELECT json_agg(c.relname ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'mvpw1_%'),
          'indexes',(SELECT json_agg(x) FROM (
            SELECT c.relname AS tablename,ic.relname AS indexname,i.indisunique,i.indisvalid,i.indisready,
              pg_get_expr(i.indpred,i.indrelid) AS predicate,
              ARRAY(SELECT a.attname FROM unnest(i.indkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum ORDER BY k.ord) AS columns,
              ARRAY(SELECT a.attnotnull FROM unnest(i.indkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum ORDER BY k.ord) AS not_null,
              pg_get_indexdef(i.indexrelid) AS definition
            FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_class ic ON ic.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relname LIKE 'mvpw1_%' ORDER BY c.relname,ic.relname
          ) x)
        ) AS evidence
      """
      response_type = "single"
    } as $catalog
  }
  response = $catalog.evidence
  tags = ["m1:execution-preparation","read-only"]
}
