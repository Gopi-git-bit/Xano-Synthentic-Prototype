import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SANDBOX_PREVIEW_BRANCH = 'feat/protected-synthetic-customer-preview-20261103';

export function previewBuildPlan(env) {
  const enabled = env.VERCEL_ENV === 'preview'
    && env.VERCEL_GIT_COMMIT_REF === SANDBOX_PREVIEW_BRANCH;
  return {
    enabled,
    args: enabled ? ['run', 'build', '--', '--mode', 'sandbox-preview'] : ['run', 'build'],
    injectedValue: enabled ? 'synthetic-only' : '',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const plan = previewBuildPlan(process.env);
  const runner = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(runner, plan.args, {
    stdio: 'inherit',
    env: { ...process.env, VITE_ZIPPY_SANDBOX_UI: plan.injectedValue },
  });
  if (result.error) {
    console.error('Preview build failed:', result.error.message);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}
