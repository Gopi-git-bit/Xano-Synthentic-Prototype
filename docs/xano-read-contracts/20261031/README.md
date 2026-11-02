# Zippy — Owner and Admin Read API Proposal

**Checkpoint:** ROLE_SCOPED_GET_CONTRACTS_OFFLINE_VALIDATED
**Workspace:** Xano 3, v1/live (read-only source reference only)
**Baseline:** 34 table definitions, 85 XanoScript definitions in the last published snapshot.
**Mode:** Offline proposal; **zero** Xano saves, publication, record access, auth calls or schema mutations.

## Published customer read contracts reviewed

- `GET /bookings`: Xano authorizes customer role and active organization with `security/resolve_context`, filters `customer_booking.customer_organization_id`, and returns narrow booking/payment state projections. The frontend gateway requires independent `XANO_AUTH_RELEASE=verified` and `XANO_BOOKING_READS_RELEASE=verified`, validates identity/organization and strips unapproved fields.
- `GET /bookings/{booking_id}`: Xano applies owner-organization filter before detail projection, `security/authorize_resource` for read, and only emits cargo/active hold row identifiers. The frontend transforms these into counts. `allowed_actions=[]`.
- These handlers exist in published XanoScript, but **authenticated live reads were not executed**. No verified isolated test account and synthetic-only dataset were available in this task. Reading live customer records is not authorized.
- Do not change release flags, auth configuration, Vercel deployment, Xano API publication, or private Xano business records.

## Four new offline endpoint candidates

| File | GET contract | Object and tenant policy | Response fields |
| --- | --- | --- | --- |
| owner_trips_GET.xs | `owner/trips` | authenticated active vendor/both org, system and membership roles; drivers only receive trip rows assigned to their DB-linked driver profile | trip ID/code, vendor organization, booking/vehicle/driver IDs, status |
| owner_trip_id_GET.xs | `owner/trips/{trip_id}` | exact trip ID plus organization; driver must be assigned to trip and linked to active vendor org | same limited operational data plus start/end timestamps |
| admin_bookings_GET.xs | `admin/bookings?organization_id=N` | platform role AND explicit active owner/admin membership of the target customer organization; bounded paging and org filter | booking ID/reference, customer org, lifecycle, pickup/delivery cities and version |
| admin_booking_id_GET.xs | `admin/bookings/{booking_id}?organization_id=N` | same independent admin grant plus exact resource lookup | identical admin projection |

No customer contact details, finance amounts, location telemetry, private route geometry, credentials, payment events, settlement or refunds are returned in these proposed projections.

## Validation and risk gates

- Official local XanoScript language validator (v2.2.6) passed **4/4** complete proposals.
- The four proposed definitions are **not** created in Xano and do not have published GUIDs.
- Frontend gateway refuses all four routes even when hypothetical release flags are set. New mocked server tests cover driver, vendor admin, fleet manager, operations admin and super admin accounts.
- Platform admin cross-organization reads are intentionally denied **unless** an explicit active target-organization owner/admin membership exists. This is conservative; broader platform oversight requires independently reviewed privilege grants, not unrestricted org enumeration.
- Driver read design requires an active `organization_member` driver role and linked `driver_profile`; this may need compatibility review for salaried drivers with a different membership role.
- `security/resolve_context` and physical foreign-key behavior remain runtime-unverified for these new endpoints; no validation of business-record outcomes is claimed.
- API-level session binding, detailed RBAC negative scenarios, pagination, missing/foreign record behavior and unexpected response shape must be exercised in an **independently isolated test runtime** before activation.
- No schema change is needed for these read endpoints, but **publication and test execution remain blocked** pending explicit authorization.

## Permitted next activity

Continue frontend UX and local mocks. When an independently isolated environment and controlled synthetic identity are approved, test only the approved GET routes with customer, vendor, driver and admin accounts, asserting zero foreign-record disclosure and zero write-side effects. Leave payment, refunds, ToPay, booking commands, POD upload, real tracking, Telnyx and webhook processing disabled.

**Decision:** OFFLINE_READ_CONTRACTS_READY_FOR_ISOLATED_AUTHORIZATION_REVIEW; **NOT RUNTIME VERIFIED**. Stage P and production blocked.
