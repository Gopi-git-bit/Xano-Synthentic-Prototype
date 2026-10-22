'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),dir='backend/agent-package/';
const c=json(dir+'Zippy_Agent_Contracts.json'),t=json(dir+'Zippy_Acceptance_Tests.json'),s=json(dir+'Zippy_Agent_Output.schema.json'),m=json(dir+'PACKAGE_MANIFEST.json');
for(const f of m.files){const b=read(dir+f.name);assert.equal(b.length,f.size_bytes);assert.equal(hash(b),f.sha256);}
for(const p of fs.readdirSync(path.join(root,dir)).filter(p=>p.endsWith('.json')))json(dir+p);
const ids=a=>new Set(a.map(x=>x.id)),agents=ids(c.agents),reqs=ids(c.requirements),rules=ids(c.business_rules),tests=ids(t.tests),sources=ids(c.source_registry);
assert.deepEqual([...agents],['OMS','IMS','TMS','VERIFICATION','FINANCE_COMPLIANCE']);assert.equal(c.requirements.length,20);assert.equal(t.tests.length,70);assert.ok(t.tests.every(x=>x.status==='not_run'));assert.equal(c.decisions.length,15);assert.ok(c.decisions.every(x=>x.approved_value===null));assert.equal(s.additionalProperties,false);
for(const r of c.requirements){for(const x of r.acceptance_test_ids)assert.ok(tests.has(x));for(const x of r.business_rule_refs)assert.ok(rules.has(x));}
for(const test of t.tests){for(const x of test.agents)assert.ok(agents.has(x));for(const x of test.requirement_refs)assert.ok(reqs.has(x));for(const x of test.business_rule_refs)assert.ok(rules.has(x));}
for(const b of c.business_rules)for(const x of b.source_refs)assert.ok(sources.has(x));
const e=json('backend/evidence/five-agent-configuration.json');assert.equal(e.created_agents,5);assert.equal(e.existing_documents_preserved,104);assert.equal(e.live_before,e.live_after);assert.equal(e.model_calls,0);assert.equal(e.operational_tool_bindings,0);
for(const a of e.agents){const p='backend/xano/ai/agent/zippy_'+a.agent_id.toLowerCase()+'_sandbox_draft.xs',x=read(p).toString();assert.equal(hash(x.trim()),a.source_sha256);assert.ok(x.includes(a.guid));assert.match(x,/tools\s*=\s*\[\]/);assert.match(x,/max_steps\s*:\s*1/);assert.match(x,/search_grounding\s*:\s*false/);assert.ok(x.includes('proposed_action must be null'));assert.ok(x.includes('Odoo accounting authority is preserved'));}
const r=json('backend/evidence/five-agent-readiness-map.json');assert.equal(r.requirements.length,20);assert.equal(r.proposed_graph_adopted,false);assert.equal(r.native_operational_acceptance,'NOT_RUN');
console.log('PASS: five unbound agent exports, supplied package hashes and references, preserved source, 20 readiness mappings. Scope: offline configuration only; 70 acceptance scenarios remain NOT_RUN.');
