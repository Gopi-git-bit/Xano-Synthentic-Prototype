// Isolated failure injection, callable only through the authenticated Metadata API.
function "Proof/rollback" {
  input {
    enum failure {
      values = ["database", "application"]
    }
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $identity
  
    precondition ($identity.database == "e9aa-vgbb-7f5c") {
      error_type = "accessdenied"
      error = "Disposable proof database required"
    }
  
    security.create_uuid as $proof_id
    var $caught {
      value = false
    }
  
    var $insert_reached {
      value = false
    }
  
    try_catch {
      try {
        db.transaction {
          stack {
            db.add proof_rows {
              data = {
                proof_id: $proof_id
                reason  : "synthetic rollback probe"
              }
            } as $inserted
          
            var.update $insert_reached {
              value = true
            }
          
            conditional {
              if ($input.failure == "database") {
                db.direct_query {
                  sql = "SELECT 1 / 0 AS synthetic_database_failure"
                  response_type = "single"
                } as $failure
              }
            
              else {
                throw {
                  name = "inputerror"
                  value = "synthetic_application_failure"
                }
              }
            }
          }
        }
      }
    
      catch {
        var.update $caught {
          value = true
        }
      }
    }
  
    db.query proof_rows {
      where = $db.proof_rows.proof_id == $proof_id
      return = {type: "count"}
    } as $residue
  }

  response = {
    insert_reached: $insert_reached
    failure       : $input.failure
    caught        : $caught
    residual_rows : $residue
    clean         : $residue == 0
  }

  guid = "lnuZftK6JqwrEifXal5C9AZ4Yfo"
}
