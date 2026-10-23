'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createNativeAdapter,activation}=require('../backend/milestone1/execution-v3/native-adapter.cjs');
const {execute}=require('../backend/milestone1/execution-v3/executor.cjs');
(async()=>{
 const args=process.argv.slice(2);
 if(args.length===0 || (args.length===1 && args[0]==='--check')){
  const status=activation();process.stdout.write(JSON.stringify(status,null,2)+'\n');process.exitCode=status.ready?0:2;return;
 }
 if(args.length!==2 || args[0]!=='--execute')throw Error('Usage: node scripts/run-m1-execution.cjs [--check | --execute NEW_EVIDENCE_FILE]');
 const target=path.resolve(args[1]);const handle=fs.openSync(target,'wx',0o600);
 try{
  const adapter=createNativeAdapter();
  const report=await execute(adapter,{record:async r=>{fs.ftruncateSync(handle,0);fs.writeSync(handle,JSON.stringify(r,null,2)+'\n',0,'utf8');fs.fsyncSync(handle);}});
  process.stdout.write(JSON.stringify({complete:report.complete,hosted_passes:report.hosted_passes,statuses:report.cases.map(c=>({id:c.id,status:c.status})),blocker:report.blocker||null})+'\n');
  process.exitCode=report.complete?0:2;
 }finally{fs.closeSync(handle);}
})().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
