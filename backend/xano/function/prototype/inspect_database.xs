// Internal metadata-only inspection. No public route.
function "Prototype/inspect_database" {
  input {
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $identity
  
    precondition ($identity.database == "sn9m-aat6-200c") {
      error_type = "accessdenied"
      error = "Prototype requires the isolated sandbox"
    }
  
    db.direct_query {
      sql = """
          SELECT json_build_object(
            'database', current_database(),
            'tables', (SELECT json_agg(t) FROM (
               SELECT c.relname AS name,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls
               FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'mvpw%' ORDER BY c.relname
            ) t),
            'indexes', (SELECT json_agg(i) FROM (
               SELECT tablename,indexname,indexdef FROM pg_indexes
               WHERE schemaname='public' AND tablename LIKE 'mvpw%' ORDER BY tablename,indexname
            ) i),
            'constraints', (SELECT json_agg(x) FROM (
               SELECT c.relname AS tablename,co.conname,co.contype,pg_get_constraintdef(co.oid) AS definition
               FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid
               JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relname LIKE 'mvpw%' ORDER BY c.relname,co.conname
            ) x),
            'triggers', (SELECT json_agg(x) FROM (
               SELECT c.relname AS tablename,t.tgname,pg_get_triggerdef(t.oid) AS definition
               FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
               WHERE c.relname LIKE 'mvpw%' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname
            ) x),
            'columns', (SELECT json_agg(x) FROM (
               SELECT table_name,column_name,data_type FROM information_schema.columns
               WHERE table_schema='public' AND table_name LIKE 'mvpw%' ORDER BY table_name,ordinal_position
            ) x)
          ) AS evidence
        """
      response_type = "single"
    } as $inspection
  }

  response = $inspection.evidence
  tags = ["zippy:prototype", "metadata-only"]
  guid = "bwaWUkQSfZLnV6fPosX7UjWQ3Tg"
}