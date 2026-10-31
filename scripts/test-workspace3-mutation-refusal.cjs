'use strict';
// Offline source gate, not a Xano parser or runtime emulator.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../backend/reconciliation-20261029');
const snapshot=process.env.W3_CAPTURE_ROOT||path.join(root,'evidence');
const inventory=JSON.parse(fs.readFileSync(path.join(snapshot,'published-inventory.json')));
const routes=inventory.documents.filter(d=>d.type==='query'&&d.group==='Zippy_V1'&&['POST','PATCH','DELETE','PUT'].includes(d.verb));
const sourceRoot=process.env.W3_TEST_PUBLISHED==='1'?snapshot:root;
test('covers every captured mutation route',()=>assert.equal(routes.length,12));
for(const route of routes)test(route.verb+' '+route.name+' refuses before any effect',()=>{
 const relative=process.env.W3_TEST_PUBLISHED==='1'?route.file:route.file.replace(/^published\//,'candidate/');
 const source=fs.readFileSync(path.join(sourceRoot,relative),'utf8').replace(/\/\/[^\n]*/g,'');
 assert.match(source,/auth\s*=\s*"user"/,'application authentication required');
 // Whole stack allowlist prevents hidden operations, nested bypasses and future accidental writes.
 assert.match(source,/stack\s*\{\s*precondition\s*\(false\)\s*\{\s*error_type\s*=\s*"accessdenied"\s*error\s*=\s*"Booking mutations are unavailable pending release review\."\s*\}\s*\}/,'unconditional explicit refusal required');
 assert.doesNotMatch(source,/\b(?:db|function|api|ai|security|util)\./,'no effects or helper calls');
 assert.match(source,/input\s*\{\s*\}/);assert.match(source,/response\s*=\s*null/);
 assert.ok(source.includes('guid = "'+route.guid+'"'),'preserve endpoint identity');
 assert.ok(source.includes('api_group = "Zippy_V1"'));assert.ok(source.includes('verb='+route.verb));
 const name=source.match(/query\s+(?:"([^"]+)"|(\w+))/);assert.equal(name[1]||name[2],route.name);
});
