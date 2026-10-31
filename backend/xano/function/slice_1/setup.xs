// Bounded synthetic acceptance slice; not a production API.
function "Slice1/setup" {
  input {
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $db_identity
  
    precondition ($db_identity.database == "sn9m-aat6-200c") {
      error_type = "accessdenied"
      error = "Synthetic slice is restricted to the verified sandbox database"
    }
  
    db.transaction {
      stack {
        db.get roles {
          field_name = "role_code"
          field_value = "admin"
        } as $role
      
        conditional {
          if ($role == null) {
            db.add roles {
              data = {
                role_code  : "admin"
                description: "Canonical admin role; synthetic test setup"
              }
            } as $row
          }
        }
      
        db.get roles {
          field_name = "role_code"
          field_value = "customer"
        } as $role
      
        conditional {
          if ($role == null) {
            db.add roles {
              data = {
                role_code  : "customer"
                description: "Canonical customer role; synthetic test setup"
              }
            } as $row
          }
        }
      
        db.get roles {
          field_name = "role_code"
          field_value = "vendor"
        } as $role
      
        conditional {
          if ($role == null) {
            db.add roles {
              data = {
                role_code  : "vendor"
                description: "Canonical vendor role; synthetic test setup"
              }
            } as $row
          }
        }
      
        db.get roles {
          field_name = "role_code"
          field_value = "driver"
        } as $role
      
        conditional {
          if ($role == null) {
            db.add roles {
              data = {
                role_code  : "driver"
                description: "Canonical driver role; synthetic test setup"
              }
            } as $row
          }
        }
      
        db.query platforms {
          where = $db.platforms.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
          return = {type: "single"}
        } as $existing_platform
      
        conditional {
          if ($existing_platform == null) {
            db.add platforms {
              data = {
                platform_id : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                platform_key: "synthetic_s1_61aa324d_a"
                display_name: "Synthetic slice 1 61aa324d a"
              }
            } as $row
          
            db.add user {
              data = {
                name    : "Synthetic slice1 a"
                email   : "s1-61aa324d-a@example.invalid"
                password: null
                role    : "member"
              }
            } as $auth_user
          
            db.add accounts {
              data = {
                account_id      : "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "xano:" ~ $auth_user.id
                email_normalized: "s1-61aa324d-a@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "4b7f0ef4-883c-470e-9db9-9b59f94886ab"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                role_code     : "admin"
                valid_from    : 0
                correlation_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "6de16a10-76a1-4e20-a021-cd5e75a16331"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                role_code     : "customer"
                valid_from    : 0
                correlation_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
              }
            } as $row
          
            db.add customer_profiles {
              data = {
                customer_profile_id: "46abb6ab-64aa-4b17-81fc-bc746e0cb8fb"
                platform_id        : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id         : "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verification_status: "verified"
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "110bf847-bde2-4a8c-a0f5-b6fb1f216609"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:a:vendor"
                email_normalized: "vendor-61aa324d-a@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "419e7ded-ad1d-4601-823f-6a15e613a730"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "110bf847-bde2-4a8c-a0f5-b6fb1f216609"
                role_code     : "vendor"
                valid_from    : 0
                correlation_id: "110bf847-bde2-4a8c-a0f5-b6fb1f216609"
              }
            } as $row
          
            db.add vendor_profiles {
              data = {
                vendor_profile_id : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "110bf847-bde2-4a8c-a0f5-b6fb1f216609"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add vehicle_models {
              data = {
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                model_code            : "SYN-61aa324d-a"
                display_name          : "Synthetic closed vehicle"
                capacity_kg           : 1000
                body_type             : "closed"
                source_version        : "synthetic-s1-v1"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
                active                : true
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "a0d537e9-e131-4ec5-a942-509f16815e39"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:622b382a-ca58-4789-ada3-d82786d69651"
                email_normalized: "622b382a-ca58-4789-ada3-d82786d69651@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "26b1a03d-18cc-4b9e-8cc2-943db8341885"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "a0d537e9-e131-4ec5-a942-509f16815e39"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "622b382a-ca58-4789-ada3-d82786d69651"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "622b382a-ca58-4789-ada3-d82786d69651"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "a0d537e9-e131-4ec5-a942-509f16815e39"
                licence_reference : "SYN-622b382a-ca58-4789-ada3-d82786d69651"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "e234b486-f497-4ee6-bf8c-bee5bd2cbe65"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "622b382a-ca58-4789-ada3-d82786d69651"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "24ca1b5c-c369-4fdd-ab4e-e5dd19a1e90d"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-0"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "b33dbeab-6151-44d4-887b-fe269c3aef30"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "24ca1b5c-c369-4fdd-ab4e-e5dd19a1e90d"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/24ca1b5c-c369-4fdd-ab4e-e5dd19a1e90d/insurance"
                checksum_sha256       : "00eed4dc6c9f3ed8805161ea86484c6354d3378c15ed085f307252fd84c2863a"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "189745ff-ca14-49ec-8f83-0d9edab572a8"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "24ca1b5c-c369-4fdd-ab4e-e5dd19a1e90d"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/24ca1b5c-c369-4fdd-ab4e-e5dd19a1e90d/fitness"
                checksum_sha256       : "c2077db7cd7536f0fc3b19c55de1356753dc75a1bb4a4babe5cbdaa53d5c6562"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "1bdfd378-a86e-40af-ad7a-8121f81d19f2"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:a6e3218d-deb4-4e76-81b7-cbdc5bf8b643"
                email_normalized: "a6e3218d-deb4-4e76-81b7-cbdc5bf8b643@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "d6647789-88d7-426c-a5fe-4f7822b66efc"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "1bdfd378-a86e-40af-ad7a-8121f81d19f2"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "a6e3218d-deb4-4e76-81b7-cbdc5bf8b643"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "a6e3218d-deb4-4e76-81b7-cbdc5bf8b643"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "1bdfd378-a86e-40af-ad7a-8121f81d19f2"
                licence_reference : "SYN-a6e3218d-deb4-4e76-81b7-cbdc5bf8b643"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "048c6352-7237-4c19-bb2b-c2cac72c55b5"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "a6e3218d-deb4-4e76-81b7-cbdc5bf8b643"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "1684d32d-34c6-4252-bd04-6833615d8e7d"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-1"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "f90d0211-ca0a-488e-91e5-a115799eb9b2"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "1684d32d-34c6-4252-bd04-6833615d8e7d"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/1684d32d-34c6-4252-bd04-6833615d8e7d/insurance"
                checksum_sha256       : "e4aebc1df64b939661322f3fe4e2b566550615d7c1775b9953049d181bab0340"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "8cd237a0-d92d-47d7-8049-7bcb0402d270"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "1684d32d-34c6-4252-bd04-6833615d8e7d"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/1684d32d-34c6-4252-bd04-6833615d8e7d/fitness"
                checksum_sha256       : "1ce87ed36951c43cb77f8fa5c8f4c3042ec45864246ab182e5f0b567ead51f3a"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "3cd6561d-706a-401f-a9b8-1ffd144a172a"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2"
                email_normalized: "7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "8ec15f37-de5f-406c-b1e9-a9bb5fec0f68"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "3cd6561d-706a-401f-a9b8-1ffd144a172a"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "3cd6561d-706a-401f-a9b8-1ffd144a172a"
                licence_reference : "SYN-7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "26dc1168-1ad9-4359-85fe-06e12e9e0620"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "1dfda5ef-79c4-4b51-817c-dfcd70c1d926"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-2"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "47678bb6-be18-4129-8f32-d532aa8704d2"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "1dfda5ef-79c4-4b51-817c-dfcd70c1d926"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/1dfda5ef-79c4-4b51-817c-dfcd70c1d926/insurance"
                checksum_sha256       : "a94de96d1bebb57623ee239293b0f99842c317e495001e189e83af982af4a6c4"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "e958e1b5-bd12-4ede-8ef6-843b98f40a69"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "1dfda5ef-79c4-4b51-817c-dfcd70c1d926"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/1dfda5ef-79c4-4b51-817c-dfcd70c1d926/fitness"
                checksum_sha256       : "f2c7637c85e14499dd5d23112d8052e6a267e6fd4ec8768cea9e40b02a85c31b"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "2cc7c754-b201-421a-a0be-f921774c2644"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:d1a80ab3-e471-41e4-a37d-0b6f4412a328"
                email_normalized: "d1a80ab3-e471-41e4-a37d-0b6f4412a328@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "5b7ca0be-1c11-49f1-b10e-68cb31e12b1e"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "2cc7c754-b201-421a-a0be-f921774c2644"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "d1a80ab3-e471-41e4-a37d-0b6f4412a328"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "d1a80ab3-e471-41e4-a37d-0b6f4412a328"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "2cc7c754-b201-421a-a0be-f921774c2644"
                licence_reference : "SYN-d1a80ab3-e471-41e4-a37d-0b6f4412a328"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "7f2383ef-8bed-4a58-af30-0d4c8505fd10"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "d1a80ab3-e471-41e4-a37d-0b6f4412a328"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "eb7d070b-d6ce-4b83-b9ca-196e8e057480"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-3"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "8e9997af-3261-4823-81de-731bc6051f79"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "eb7d070b-d6ce-4b83-b9ca-196e8e057480"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/eb7d070b-d6ce-4b83-b9ca-196e8e057480/insurance"
                checksum_sha256       : "c1134c3df7d87492c77c2f5455c151610c7018b37394c9da5cfaea666db3c82d"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "719f8350-e809-42c9-8e6c-7274caaddf1d"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "eb7d070b-d6ce-4b83-b9ca-196e8e057480"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/eb7d070b-d6ce-4b83-b9ca-196e8e057480/fitness"
                checksum_sha256       : "4614f665403c51eb70844d3e8948c64ae4daa347883c5bef04e16b651753992e"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "5281b486-9c3b-4204-919b-f689a6fc0997"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1"
                email_normalized: "1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "642f2bb0-bc79-4393-b4d4-0084dcc8f625"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "5281b486-9c3b-4204-919b-f689a6fc0997"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "5281b486-9c3b-4204-919b-f689a6fc0997"
                licence_reference : "SYN-1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "cb066413-655e-4f57-85b8-5a6ccf7acf80"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "d4dddae9-811a-45ea-b69c-39d96dd54ada"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-4"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "c7ebbcd2-ae87-492b-b2e2-bc370637e1ca"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "d4dddae9-811a-45ea-b69c-39d96dd54ada"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/d4dddae9-811a-45ea-b69c-39d96dd54ada/insurance"
                checksum_sha256       : "a200a69e444862ca7d8de9684c65bafddce67d898088a306d5097965c8ca5bae"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "3b4e8f8a-30e3-4efb-8518-7e8370f8255e"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "d4dddae9-811a-45ea-b69c-39d96dd54ada"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/d4dddae9-811a-45ea-b69c-39d96dd54ada/fitness"
                checksum_sha256       : "3b2683cd61d0ae55d93f46925c39392d2ab059164da0e7cbdc8708210bb8c972"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "9c43c1ef-87a2-4856-9dfa-9a723407d109"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:f2825860-a636-48b7-9971-4445ea421eea"
                email_normalized: "f2825860-a636-48b7-9971-4445ea421eea@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "4605d7cb-fa16-47ff-8ac6-bde3820b6d3d"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "9c43c1ef-87a2-4856-9dfa-9a723407d109"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "f2825860-a636-48b7-9971-4445ea421eea"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "f2825860-a636-48b7-9971-4445ea421eea"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "9c43c1ef-87a2-4856-9dfa-9a723407d109"
                licence_reference : "SYN-f2825860-a636-48b7-9971-4445ea421eea"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "b8a0d3be-fd6b-4e12-8eb8-cde81c61b97b"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "f2825860-a636-48b7-9971-4445ea421eea"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "f152ade6-0801-4c46-8d32-7005b12fe973"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-5"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "586b72fc-57c4-4dcd-84e5-0f14cf29758e"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "f152ade6-0801-4c46-8d32-7005b12fe973"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/f152ade6-0801-4c46-8d32-7005b12fe973/insurance"
                checksum_sha256       : "ba8ca945a29f52d85c134e0a4138533c58167957561dfeebd428f59fe9382245"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "22c94ad2-cdb4-43fe-8ac8-1752ade55474"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "f152ade6-0801-4c46-8d32-7005b12fe973"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/f152ade6-0801-4c46-8d32-7005b12fe973/fitness"
                checksum_sha256       : "10c5cf146256114611fdb299550e2c8ec6f5d6c34eb57b951fa7fbab91d4bdff"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "ec2a6362-c4ca-4efd-9213-df5ec4d8fe7a"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:86a21c28-18e6-44bd-a4c9-c9be697f84c4"
                email_normalized: "86a21c28-18e6-44bd-a4c9-c9be697f84c4@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "6a366b66-2f2c-4c81-8c3e-4c1eb6d2ae36"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "ec2a6362-c4ca-4efd-9213-df5ec4d8fe7a"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "86a21c28-18e6-44bd-a4c9-c9be697f84c4"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "86a21c28-18e6-44bd-a4c9-c9be697f84c4"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "ec2a6362-c4ca-4efd-9213-df5ec4d8fe7a"
                licence_reference : "SYN-86a21c28-18e6-44bd-a4c9-c9be697f84c4"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "33f86110-1e4d-48bc-820a-96f3a5adc4d4"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "86a21c28-18e6-44bd-a4c9-c9be697f84c4"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "ae583565-f2f8-4dab-845d-74c58904d7d8"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-6"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "6a67aad3-94e7-456c-838f-54bc7adf65a9"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "ae583565-f2f8-4dab-845d-74c58904d7d8"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/ae583565-f2f8-4dab-845d-74c58904d7d8/insurance"
                checksum_sha256       : "1c0bb167ed8bb60a8edc041330cbc5ecf1383bb5e8c080342326e09fd06a6949"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "02715014-adb2-4a9a-ab91-a6fd3487cd86"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "ae583565-f2f8-4dab-845d-74c58904d7d8"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/ae583565-f2f8-4dab-845d-74c58904d7d8/fitness"
                checksum_sha256       : "00487005836941a43f0a040382480dede0128470b2c35a24261f9b8a3ee9face"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "d7f93cae-1ccd-4fe6-990e-711c73d9d6bd"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:62c65079-5dc0-4c4e-b157-132d58a5bc66"
                email_normalized: "62c65079-5dc0-4c4e-b157-132d58a5bc66@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "e92cd611-4810-41c4-87a9-e85144f0cf02"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "d7f93cae-1ccd-4fe6-990e-711c73d9d6bd"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "62c65079-5dc0-4c4e-b157-132d58a5bc66"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "62c65079-5dc0-4c4e-b157-132d58a5bc66"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "d7f93cae-1ccd-4fe6-990e-711c73d9d6bd"
                licence_reference : "SYN-62c65079-5dc0-4c4e-b157-132d58a5bc66"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "90feec82-2c97-409b-8f05-b5e56c2fe054"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "62c65079-5dc0-4c4e-b157-132d58a5bc66"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "05c12f89-6e48-4697-9c53-39487a156757"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-7"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "d60fac4d-1250-4377-8d87-2dd29143e3e9"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "05c12f89-6e48-4697-9c53-39487a156757"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/05c12f89-6e48-4697-9c53-39487a156757/insurance"
                checksum_sha256       : "d37a9fffd918e1499556d4d5a5364cf1c23f200c2c97050f9072ccf3af622c2c"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "7380eae9-01fb-4780-bdd9-5c0f6f634f5c"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "05c12f89-6e48-4697-9c53-39487a156757"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/05c12f89-6e48-4697-9c53-39487a156757/fitness"
                checksum_sha256       : "ad778d44ed26af1ee56617fd37d92cc9faab4d038e5f2d296de4b1942b4f0c1e"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "145bc363-cdb1-4d4f-9259-2bd4afc4623e"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:3f432245-a64e-4537-a07d-1dacd4a86d95"
                email_normalized: "3f432245-a64e-4537-a07d-1dacd4a86d95@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "44479c27-6dd8-4391-877d-4fb35bd5073b"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "145bc363-cdb1-4d4f-9259-2bd4afc4623e"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "3f432245-a64e-4537-a07d-1dacd4a86d95"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "3f432245-a64e-4537-a07d-1dacd4a86d95"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "145bc363-cdb1-4d4f-9259-2bd4afc4623e"
                licence_reference : "SYN-3f432245-a64e-4537-a07d-1dacd4a86d95"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "cdfb2038-4b5c-427b-a776-652630462cd7"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "3f432245-a64e-4537-a07d-1dacd4a86d95"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "a2fea98a-2819-4c26-b43b-ad3c94929bad"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-8"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "647503df-c11e-4377-a550-861818eaa9d0"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "a2fea98a-2819-4c26-b43b-ad3c94929bad"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/a2fea98a-2819-4c26-b43b-ad3c94929bad/insurance"
                checksum_sha256       : "4362c38b3b10530d12c5c8f502f09eb1467cede90a564a0af547c7ad824867ba"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "54a35614-2c54-4f5a-9289-fb5888fd832b"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "a2fea98a-2819-4c26-b43b-ad3c94929bad"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/a2fea98a-2819-4c26-b43b-ad3c94929bad/fitness"
                checksum_sha256       : "33e26a371c2bee9b89a4f980fa4d5f6b0201da72068b4c4ea37637f5f74314ac"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "a86a437a-6936-4bcf-bc58-ed6d7af79e69"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:dbc383bb-66ee-4ebe-82aa-c80e19286e1a"
                email_normalized: "dbc383bb-66ee-4ebe-82aa-c80e19286e1a@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "5faebee2-ec7c-40b3-bac2-8d1b893b3b8e"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "a86a437a-6936-4bcf-bc58-ed6d7af79e69"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "dbc383bb-66ee-4ebe-82aa-c80e19286e1a"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "dbc383bb-66ee-4ebe-82aa-c80e19286e1a"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "a86a437a-6936-4bcf-bc58-ed6d7af79e69"
                licence_reference : "SYN-dbc383bb-66ee-4ebe-82aa-c80e19286e1a"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "d8acbdfc-c10a-4e24-8528-06c226171fb6"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "dbc383bb-66ee-4ebe-82aa-c80e19286e1a"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "48a72e7a-5fc0-4dad-8680-cc1cf20a1982"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-9"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "887cf471-7b85-44dd-b89f-0cb4271de85c"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "48a72e7a-5fc0-4dad-8680-cc1cf20a1982"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/48a72e7a-5fc0-4dad-8680-cc1cf20a1982/insurance"
                checksum_sha256       : "de4ad2aae45ffaa470fec6de7a917dcd216ae921d01f2023e057430e1db56442"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "ee956a2f-c9b3-42af-a47c-f13a5ed117d4"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "48a72e7a-5fc0-4dad-8680-cc1cf20a1982"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/48a72e7a-5fc0-4dad-8680-cc1cf20a1982/fitness"
                checksum_sha256       : "2ebe6cb76d1fcd6b993385e0e511731c5a70cdd1444b7960e870b9fa803d42db"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "ff422525-7b2b-4bab-90a4-2e6bfdb518d0"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:691375bd-3af9-48b6-aa6c-21d2259cab45"
                email_normalized: "691375bd-3af9-48b6-aa6c-21d2259cab45@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "c44c9435-f8d5-4ba8-babc-c702adec488d"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "ff422525-7b2b-4bab-90a4-2e6bfdb518d0"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "691375bd-3af9-48b6-aa6c-21d2259cab45"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "691375bd-3af9-48b6-aa6c-21d2259cab45"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "ff422525-7b2b-4bab-90a4-2e6bfdb518d0"
                licence_reference : "SYN-691375bd-3af9-48b6-aa6c-21d2259cab45"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "7ce770df-e469-4e68-8d47-3807e2dcae99"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "691375bd-3af9-48b6-aa6c-21d2259cab45"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "501b62df-0c88-4511-bd7a-9998f08276a5"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-10"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "75921383-4d4a-4259-8aba-9f4204f085ba"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "501b62df-0c88-4511-bd7a-9998f08276a5"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/501b62df-0c88-4511-bd7a-9998f08276a5/insurance"
                checksum_sha256       : "192fd8d1915dfa68c14165142c53f21d1fc682bb9858f48b5f848b7cebae3114"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "182e1a09-45a2-470f-a162-9862b710a25c"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "501b62df-0c88-4511-bd7a-9998f08276a5"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/501b62df-0c88-4511-bd7a-9998f08276a5/fitness"
                checksum_sha256       : "5f1d265486a2009d66b3a813ff828e625679b38c68b9461c7a77c1e14b611711"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "33e2ed10-8c3f-4b28-b49d-04878705985f"
                platform_id     : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                external_subject: "synthetic:61aa324d:driver:3839cf52-800d-42d7-b4f4-137fe66dd815"
                email_normalized: "3839cf52-800d-42d7-b4f4-137fe66dd815@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "e66717b6-1a8a-4e2a-bfc9-f8092bf5ef51"
                platform_id   : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id    : "33e2ed10-8c3f-4b28-b49d-04878705985f"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "3839cf52-800d-42d7-b4f4-137fe66dd815"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "3839cf52-800d-42d7-b4f4-137fe66dd815"
                platform_id       : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                account_id        : "33e2ed10-8c3f-4b28-b49d-04878705985f"
                licence_reference : "SYN-3839cf52-800d-42d7-b4f4-137fe66dd815"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "8987bd96-1da2-45a1-9896-b4cabfe96286"
                platform_id          : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                driver_profile_id    : "3839cf52-800d-42d7-b4f4-137fe66dd815"
                vendor_profile_id    : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "1a4e1dcd-0dc6-4658-a8d1-1162e0f3501c"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vendor_profile_id     : "8f88539e-5bf7-484e-acc2-ea3a3d9e30e8"
                vehicle_model_id      : "4cf690b2-80d4-4f05-b04a-558b7bf260b4"
                registration_number   : "SYN-61aa324d-a-11"
                status                : "approved"
                approved_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "949ffa1e-7e5f-4be8-b9fb-c14cc664024f"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "1a4e1dcd-0dc6-4658-a8d1-1162e0f3501c"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/1a4e1dcd-0dc6-4658-a8d1-1162e0f3501c/insurance"
                checksum_sha256       : "ec8300d85c073f599e83a60358f597b1f9efcbecaf8ac6d29c472258a0e320a5"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "fb0da14f-c51f-4817-85f5-df20134a064d"
                platform_id           : "87c1d523-8ba6-4e16-849e-0ca819e572ad"
                vehicle_id            : "1a4e1dcd-0dc6-4658-a8d1-1162e0f3501c"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/1a4e1dcd-0dc6-4658-a8d1-1162e0f3501c/fitness"
                checksum_sha256       : "7fcd5d1bd36283f0c585253071a510b83e479e66307317140f69c587fbc04eeb"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "e8066938-21c9-4732-b9bd-7b2ec3c3a180"
                verified_at           : now
              }
            } as $row
          }
        }
      
        db.query platforms {
          where = $db.platforms.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
          return = {type: "single"}
        } as $existing_platform
      
        conditional {
          if ($existing_platform == null) {
            db.add platforms {
              data = {
                platform_id : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                platform_key: "synthetic_s1_61aa324d_b"
                display_name: "Synthetic slice 1 61aa324d b"
              }
            } as $row
          
            db.add user {
              data = {
                name    : "Synthetic slice1 b"
                email   : "s1-61aa324d-b@example.invalid"
                password: null
                role    : "member"
              }
            } as $auth_user
          
            db.add accounts {
              data = {
                account_id      : "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                platform_id     : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                external_subject: "xano:" ~ $auth_user.id
                email_normalized: "s1-61aa324d-b@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "00f6452a-12a7-47a8-8887-f1bf3d968dc6"
                platform_id   : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id    : "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                role_code     : "admin"
                valid_from    : 0
                correlation_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "11cbad8b-de65-4896-9069-62ff1ea15e10"
                platform_id   : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id    : "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                role_code     : "customer"
                valid_from    : 0
                correlation_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
              }
            } as $row
          
            db.add customer_profiles {
              data = {
                customer_profile_id: "95ca8b7d-9abb-4f51-8a85-e9d05129a194"
                platform_id        : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id         : "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                verification_status: "verified"
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "67b78c27-3de0-4d5f-99c6-9eb5ae2d14e8"
                platform_id     : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                external_subject: "synthetic:61aa324d:b:vendor"
                email_normalized: "vendor-61aa324d-b@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "c29d5a4e-5835-4d93-a125-599286f4a621"
                platform_id   : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id    : "67b78c27-3de0-4d5f-99c6-9eb5ae2d14e8"
                role_code     : "vendor"
                valid_from    : 0
                correlation_id: "67b78c27-3de0-4d5f-99c6-9eb5ae2d14e8"
              }
            } as $row
          
            db.add vendor_profiles {
              data = {
                vendor_profile_id : "45545cd6-ae82-4f24-87eb-e57ccf39fbe6"
                platform_id       : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id        : "67b78c27-3de0-4d5f-99c6-9eb5ae2d14e8"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add vehicle_models {
              data = {
                vehicle_model_id      : "0d2a33f6-3493-4295-974a-2fc471d6658e"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                model_code            : "SYN-61aa324d-b"
                display_name          : "Synthetic closed vehicle"
                capacity_kg           : 1000
                body_type             : "closed"
                source_version        : "synthetic-s1-v1"
                approved_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                approved_at           : now
                active                : true
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "be5dc56b-abf5-4219-8182-fe38ff10495e"
                platform_id     : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                external_subject: "synthetic:61aa324d:driver:a72dba53-0a28-4728-8d93-eb6a80cb4ef0"
                email_normalized: "a72dba53-0a28-4728-8d93-eb6a80cb4ef0@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "e8e755f7-d241-4218-b135-84685be6c7b4"
                platform_id   : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id    : "be5dc56b-abf5-4219-8182-fe38ff10495e"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "a72dba53-0a28-4728-8d93-eb6a80cb4ef0"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "a72dba53-0a28-4728-8d93-eb6a80cb4ef0"
                platform_id       : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id        : "be5dc56b-abf5-4219-8182-fe38ff10495e"
                licence_reference : "SYN-a72dba53-0a28-4728-8d93-eb6a80cb4ef0"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "9f7b0d36-8459-4c02-b308-33ba62d1f1dd"
                platform_id          : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                driver_profile_id    : "a72dba53-0a28-4728-8d93-eb6a80cb4ef0"
                vendor_profile_id    : "45545cd6-ae82-4f24-87eb-e57ccf39fbe6"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "9ec3b1c4-d077-4851-8279-49ae088f1a8d"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                vendor_profile_id     : "45545cd6-ae82-4f24-87eb-e57ccf39fbe6"
                vehicle_model_id      : "0d2a33f6-3493-4295-974a-2fc471d6658e"
                registration_number   : "SYN-61aa324d-b-0"
                status                : "approved"
                approved_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "a94f1f3b-95bc-4c48-aa47-148c2c1516e8"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                vehicle_id            : "9ec3b1c4-d077-4851-8279-49ae088f1a8d"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/9ec3b1c4-d077-4851-8279-49ae088f1a8d/insurance"
                checksum_sha256       : "95eb9e1edeffa2ae715719056d9489237299254fd0e54d2befb2dc767398c1de"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "89986ef3-2d5f-446f-8c70-bc437a581fe3"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                vehicle_id            : "9ec3b1c4-d077-4851-8279-49ae088f1a8d"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/9ec3b1c4-d077-4851-8279-49ae088f1a8d/fitness"
                checksum_sha256       : "f1d51807fd8babc697f12fb1313d80a8e054c1d41aefc8c2dba55e85c9c63ff1"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                verified_at           : now
              }
            } as $row
          
            db.add accounts {
              data = {
                account_id      : "62b4766a-398d-49ca-999b-c1f772757cde"
                platform_id     : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                external_subject: "synthetic:61aa324d:driver:4a117d8a-f08e-436d-afe2-89bad911ab06"
                email_normalized: "4a117d8a-f08e-436d-afe2-89bad911ab06@example.invalid"
                status          : "active"
              }
            } as $row
          
            db.add account_role_memberships {
              data = {
                membership_id : "e2edd993-52d9-4f12-a621-b49039b7613c"
                platform_id   : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id    : "62b4766a-398d-49ca-999b-c1f772757cde"
                role_code     : "driver"
                valid_from    : 0
                correlation_id: "4a117d8a-f08e-436d-afe2-89bad911ab06"
              }
            } as $row
          
            db.add driver_profiles {
              data = {
                driver_profile_id : "4a117d8a-f08e-436d-afe2-89bad911ab06"
                platform_id       : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                account_id        : "62b4766a-398d-49ca-999b-c1f772757cde"
                licence_reference : "SYN-4a117d8a-f08e-436d-afe2-89bad911ab06"
                eligibility_status: "approved"
              }
            } as $row
          
            db.add driver_associations {
              data = {
                driver_association_id: "52f6d17f-d907-45e7-891a-549fe7d45134"
                platform_id          : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                driver_profile_id    : "4a117d8a-f08e-436d-afe2-89bad911ab06"
                vendor_profile_id    : "45545cd6-ae82-4f24-87eb-e57ccf39fbe6"
                valid_from           : 0
              }
            } as $row
          
            db.add vehicles {
              data = {
                vehicle_id            : "363d3393-83b4-4746-af9f-c31b8ea5b04a"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                vendor_profile_id     : "45545cd6-ae82-4f24-87eb-e57ccf39fbe6"
                vehicle_model_id      : "0d2a33f6-3493-4295-974a-2fc471d6658e"
                registration_number   : "SYN-61aa324d-b-1"
                status                : "approved"
                approved_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                approved_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "42f4a170-4310-4195-a308-2e9859eabb92"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                vehicle_id            : "363d3393-83b4-4746-af9f-c31b8ea5b04a"
                document_type         : "insurance"
                object_key            : "synthetic/slice1/61aa324d/363d3393-83b4-4746-af9f-c31b8ea5b04a/insurance"
                checksum_sha256       : "f56d566cd66e2b40476e2c360b79aa440b7811cef474db8dd7932fdc266b35ad"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                verified_at           : now
              }
            } as $row
          
            db.add vehicle_documents {
              data = {
                vehicle_document_id   : "52be73d1-76d7-4709-9f77-624dab6e9e42"
                platform_id           : "809fab1c-e8aa-4b87-af06-9b54bff92048"
                vehicle_id            : "363d3393-83b4-4746-af9f-c31b8ea5b04a"
                document_type         : "fitness"
                object_key            : "synthetic/slice1/61aa324d/363d3393-83b4-4746-af9f-c31b8ea5b04a/fitness"
                checksum_sha256       : "7552ce808015b2804f6fff7ad4663b176a6a2a632f7d911e6c5949567582f13f"
                valid_from            : "2020-01-01"
                valid_until           : "2099-12-31"
                verification_status   : "verified"
                verified_by_account_id: "0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13"
                verified_at           : now
              }
            } as $row
          }
        }
      }
    }
  }

  response = {seeded: true, run: "61aa324d"}
  tags = ["synthetic:slice1", "reference:new-logistic"]

  test "synthetic fixture setup" {
    expect.to_be_true ($response.seeded)
  }

  guid = "nZISYMsPUMvtACroXS1QlSYyWrY"
}