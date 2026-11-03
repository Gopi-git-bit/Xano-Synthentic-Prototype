'use strict';
require('./tenant-lib.cjs').verify({prepare:process.argv.includes('--prepare-empty')}).then(result => console.log(JSON.stringify(result,null,2))).catch(() => {
  console.error('Isolated target verification failed. Check local target configuration and profile.');
  process.exitCode=1;
});
