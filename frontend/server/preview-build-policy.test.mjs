import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewBuildPlan, SANDBOX_PREVIEW_BRANCH } from '../scripts/build-preview.mjs';

test('only the exact SSO-protected preview branch can opt in to synthetic UI build', () => {
  const allowed = previewBuildPlan({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: SANDBOX_PREVIEW_BRANCH });
  assert.equal(allowed.enabled, true);
  assert.deepEqual(allowed.args, ['run', 'build', '--', '--mode', 'sandbox-preview']);
  assert.equal(allowed.injectedValue, 'synthetic-only');
});

test('production and unrelated previews always build default app without sandbox UI', () => {
  for (const env of [
    { VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: SANDBOX_PREVIEW_BRANCH },
    { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'main' },
    { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feat/other' },
    { VERCEL_ENV: 'development', VERCEL_GIT_COMMIT_REF: SANDBOX_PREVIEW_BRANCH },
    { VERCEL_ENV: 'preview' },
    {},
  ]) {
    const plan = previewBuildPlan({ ...env, VITE_ZIPPY_SANDBOX_UI: 'synthetic-only' });
    assert.equal(plan.enabled, false);
    assert.deepEqual(plan.args, ['run', 'build']);
    assert.equal(plan.injectedValue, '');
  }
});
