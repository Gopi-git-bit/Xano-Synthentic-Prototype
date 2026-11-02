// Internal read-only administrator evidence; no inputs, fixtures, DDL or public route.
function "Milestone1/admin_inventory_probe" {
  input {
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $identity
  
    precondition ($identity.database == "sn9m-aat6-200c") {
      error_type = "accessdenied"
      error = "Confirmed isolated sandbox required"
    }
  
    db.direct_query {
      sql = """
          SELECT json_build_object(
            'database', current_database(),
            'diagnostics', json_build_array(
              (SELECT json_build_object('table','mvpw1_56','row_count',count(*),'ordered_row_digest_md5',md5(coalesce(string_agg(md5(to_jsonb(d)::text),'' ORDER BY md5(to_jsonb(d)::text)),''))) FROM public.mvpw1_56 d),
              (SELECT json_build_object('table','mvpw1_57','row_count',count(*),'ordered_row_digest_md5',md5(coalesce(string_agg(md5(to_jsonb(d)::text),'' ORDER BY md5(to_jsonb(d)::text)),''))) FROM public.mvpw1_57 d)
            ),
            'diagnostic_dependencies', (SELECT coalesce(json_agg(x),'[]'::json) FROM (
              SELECT c.relname AS referenced_table,dep.deptype,
                     pg_describe_object(dep.classid,dep.objid,dep.objsubid) AS dependent_object
              FROM pg_depend dep JOIN pg_class c ON c.oid=dep.refobjid
              JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE dep.refclassid='pg_class'::regclass AND n.nspname='public'
                AND c.relname IN ('mvpw1_56','mvpw1_57')
              ORDER BY c.relname,dependent_object
            ) x),
            'assignment_indexes', (SELECT coalesce(json_agg(x),'[]'::json) FROM (
              SELECT c.relname AS tablename,ic.relname AS indexname,i.indisunique,i.indisvalid,i.indisready,
                     pg_get_indexdef(i.indexrelid) AS definition,pg_get_expr(i.indpred,i.indrelid) AS predicate
              FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_class ic ON ic.oid=i.indexrelid
              JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname='public' AND c.relname IN ('mvpw1_44','mvpw1_25')
              ORDER BY c.relname,ic.relname
            ) x),
            'active_assignment_count', (SELECT count(*) FROM public.mvpw1_44 WHERE released_at IS NULL),
            'active_vehicle_duplicate_groups', (SELECT count(*) FROM (
               SELECT platform_id,vehicle_id FROM public.mvpw1_44 WHERE released_at IS NULL
               GROUP BY platform_id,vehicle_id HAVING count(*)>1
            ) x),
            'active_driver_duplicate_groups', (SELECT count(*) FROM (
               SELECT platform_id,driver_profile_id FROM public.mvpw1_44 WHERE released_at IS NULL
               GROUP BY platform_id,driver_profile_id HAVING count(*)>1
            ) x),
            'active_assignment_null_keys', (SELECT count(*) FROM public.mvpw1_44
               WHERE released_at IS NULL AND (platform_id IS NULL OR vehicle_id IS NULL OR driver_profile_id IS NULL))
          ) AS evidence
        """
      response_type = "single"
    } as $inspection
  }

  response = $inspection.evidence
  tags = ["milestone1:admin-preparation", "metadata-only"]
  guid = "fI9pCX_Ua1Rq5fwsUzF_9jhc72A"
}
