'use strict';
// Read-only preflight. No import or hosted-case execution option.
const fs=require('node:fs'),path=require('node:path');
const {createNativeAdapter}=require('../backend/milestone1/native-adapter.cjs');
(async()=>{
  const report=await createNativeAdapter().preflight();
  if(process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({authenticated:report.authenticated,ready:report.ready,
    database:report.database,source_preserved:report.source_preserved,
    physical_tables:report.physical_table_count,unmapped_tables:report.inventory.unmapped_tables,
    index_definitions:report.index_definitions,blockers:report.blockers},null,2));
  process.exitCode=report.ready?0:2;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
