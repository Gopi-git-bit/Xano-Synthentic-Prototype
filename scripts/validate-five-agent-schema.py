import copy, hashlib, json, pathlib, sys
from datetime import datetime, timezone
from importlib.metadata import version
from jsonschema import Draft202012Validator

root = pathlib.Path(__file__).resolve().parents[1]
package = root / "backend" / "agent-package"
parsed = {p.name: json.loads(p.read_text(encoding="utf-8")) for p in package.glob("*.json")}
schema = parsed["Zippy_Agent_Output.schema.json"]
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema)
contracts = parsed["Zippy_Agent_Contracts.json"]
assert len(parsed) == 6
for entry in parsed["PACKAGE_MANIFEST.json"]["files"]:
    content = (package / entry["name"]).read_bytes()
    assert len(content) == entry["size_bytes"]
    assert hashlib.sha256(content).hexdigest() == entry["sha256"]
base = dict(schema_version="1.0.0-review",agent_id="OMS",tenant_id="synthetic-a",entity_type="order",
 entity_id="fixture-order-a",expected_entity_version=1,request_id="fixture-request",trace_id="fixture-trace",
 idempotency_key="fixture-key",policy_version="synthetic-policy-unapproved",evidence_refs=["fixture:evidence"],
 outcome="hold",reason_code="UNAPPROVED_POLICY",reason="Synthetic schema fixture, no model execution.",
 proposed_action=None,unknowns=["DEC-01"],model_version="synthetic-no-model",prompt_version="zippy-five-agent-draft-1")
results=[]
def check(name, value, expected):
    actual=validator.is_valid(value)
    assert actual == expected, name
    results.append(dict(name=name,status="pass",schema_valid=actual))
for agent in contracts["agents"]:
    x=copy.deepcopy(base); x["agent_id"]=agent["id"]; check("valid synthetic "+agent["id"],x,True)
for key in schema["required"]:
    x=copy.deepcopy(base); del x[key]; check("missing "+key,x,False)
invalid=[("unknown agent","agent_id","ROOT"),("unexpected command field","execute_sql","DROP"),
 ("invalid version","expected_entity_version",-1),("boolean version","expected_entity_version",True),
 ("blank tenant","tenant_id",""),("unexpected outcome","outcome","executed"),("oversized reason","reason","x"*2001),
 ("bad confidence","confidence",1.1),("duplicate evidence","evidence_refs",["same","same"]),
 ("unknown entity","entity_type","ledger"),("string unknowns","unknowns","DEC-01"),
 ("unlisted action","proposed_action",dict(command="issue_refund_now",arguments_ref="fixture")),
 ("extra action field","proposed_action",dict(command="request_quote",arguments_ref="fixture",execute=True)),
 ("missing action ref","proposed_action",dict(command="request_quote"))]
for name,key,value in invalid:
    x=copy.deepcopy(base); x[key]=value; check(name,x,False)

# Pure preparation helper: server_context MUST come from a future authenticated adapter.
# It does not establish authentication, database ownership or runtime RBAC.
bindings=["agent_id","tenant_id","entity_type","entity_id","expected_entity_version",
 "request_id","trace_id","idempotency_key","policy_version","prompt_version","model_version"]
def validate_unbound_draft_assessment(assessment, server_context):
    if not validator.is_valid(assessment):
        return dict(valid=False,code="SCHEMA_REJECTED",execution_authorized=False)
    if any(assessment[k] != server_context.get(k) for k in bindings):
        return dict(valid=False,code="CONTEXT_MISMATCH",execution_authorized=False)
    if assessment["proposed_action"] is not None:
        return dict(valid=False,code="DRAFT_ACTIONS_DISABLED",execution_authorized=False)
    return dict(valid=True,code="ASSESSMENT_ONLY",execution_authorized=False)
context={k:base[k] for k in bindings}
assert validate_unbound_draft_assessment(base,context)["valid"]
binding_results=[dict(name="matching synthetic context",status="pass",execution_authorized=False)]
for key in bindings:
    x=copy.deepcopy(base); x[key]=2 if key=="expected_entity_version" else "different"
    if key in ("agent_id","entity_type"):
        x[key]="IMS" if key=="agent_id" else "trip"
    r=validate_unbound_draft_assessment(x,context)
    assert not r["valid"] and not r["execution_authorized"]
    binding_results.append(dict(name="reject changed "+key,status="pass",code=r["code"]))
x=copy.deepcopy(base);x["proposed_action"]=dict(command="request_guarded_finance_action",arguments_ref="fixture")
assert validator.is_valid(x), "shared schema intentionally has no per-agent authorization"
assert validate_unbound_draft_assessment(x,context)["code"]=="DRAFT_ACTIONS_DISABLED"
binding_results.append(dict(name="reject schema-valid guarded command in unbound draft",status="pass"))
witness=copy.deepcopy(base);witness["tenant_id"]="synthetic-other"
assert validator.is_valid(witness), "schema alone does not establish tenant ownership"
report=dict(checked_at=datetime.now(timezone.utc).isoformat(),scope="Offline schema fixtures and preparation helper only; no Xano model or application execution",
 json_files_parsed=len(parsed),schema_meta_validation="PASS",validator="jsonschema "+version("jsonschema"),
 python=sys.version.split()[0],schema_cases_passed=len(results),binding_preparation_cases_passed=len(binding_results),
 results=results,binding_preparation_results=binding_results,
 limits=["Schema accepts another nonempty tenant string: trusted runtime binding is required",
 "Shared schema permits globally allowlisted commands without per-agent authorization",
 "Preparation helper is not deployed or attached to any Xano agent or request path"],
 acceptance_cases=70,acceptance_cases_executed=0,acceptance_status="ALL_NOT_RUN")
(root/"reports").mkdir(exist_ok=True)
(root/"reports"/"five-agent-schema-validation.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:report[k] for k in ["schema_meta_validation","schema_cases_passed","binding_preparation_cases_passed","acceptance_cases_executed"]}))
