'use strict';
const path=require('node:path');
process.env.ZIPPY_TARGET ||= path.resolve(__dirname,'../target.local.json');
process.env.ZIPPY_EVIDENCE_DIR ||= path.resolve(__dirname,'../.sandbox');
module.exports=require('../../agent-tools-review/scripts/tenant-lib.cjs');
