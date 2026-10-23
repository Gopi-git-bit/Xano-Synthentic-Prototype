'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const status=JSON.parse(fs.readFileSync('backend/evidence/staging-readiness.json','utf8'));
const report={commit:process.env.GITHUB_SHA||'local',status:'blocked',ready:false,export_manifest_sha256:crypto.createHash('sha256').update(fs.readFileSync('backend/evidence/tested-export.json')).digest('hex'),blockers:status.blockers};
fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/staging-readiness.json',JSON.stringify(report,null,2)+'\n');
console.error('BLOCKED: executable staging suite and required integrity evidence are incomplete.');
process.exitCode=1;
