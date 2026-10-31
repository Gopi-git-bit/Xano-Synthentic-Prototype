// Isolated sandbox capability check. Creates only a namespaced guard function.
function "Prototype/native_bootstrap" {
  input {
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database, (SELECT count(*) FROM (SELECT platform_id, vehicle_id FROM public.mvpw1_44 WHERE released_at IS NULL GROUP BY platform_id,vehicle_id HAVING count(*)>1) d) AS vehicle_duplicates, (SELECT count(*) FROM (SELECT platform_id,driver_profile_id FROM public.mvpw1_44 WHERE released_at IS NULL GROUP BY platform_id,driver_profile_id HAVING count(*)>1) d) AS driver_duplicates"
      response_type = "single"
    } as $check
  
    precondition ($check.database == "sn9m-aat6-200c" && $check.vehicle_duplicates == 0 && $check.driver_duplicates == 0) {
      error_type = "accessdenied"
      error = "Isolated database and conflict-free reservations required"
    }
  
    db.direct_query {
      sql = """
          CREATE OR REPLACE FUNCTION public.zippy_proto_guard() RETURNS text
          LANGUAGE plpgsql AS $fn$
          BEGIN
            IF current_database() <> 'sn9m-aat6-200c' THEN
              RAISE EXCEPTION 'SANDBOX_REQUIRED' USING ERRCODE='42501';
            END IF;
            RETURN current_database();
          END;
          $fn$
        """
      response_type = "single"
    } as $ddl
  
    db.direct_query {
      sql = "SELECT public.zippy_proto_guard() AS database, current_user AS db_role, version() AS postgres_version"
      response_type = "single"
    } as $probe
  }

  response = $probe
  tags = ["zippy:prototype", "internal-migration"]
  guid = "wtDzsYmx0KY-fyS12l3gp_LeRos"
}