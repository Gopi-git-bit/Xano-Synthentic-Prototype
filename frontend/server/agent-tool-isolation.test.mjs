import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

// The ephemeral Xano tool-debug interface is not an approved browser API.
// Never infer a public route from a tool name or an unrelated release flag.
test('sandbox agent tools remain inaccessible through the frontend gateway', async () => {
  let upstreamCalls = 0;
  const handle = createGateway({
    env: {
      XANO_AUTH_BASE_URL: 'https://isolated.invalid/api:auth',
      XANO_LOGISTICS_BASE_URL: 'https://isolated.invalid/api:zippy-v1',
      XANO_AUTH_RELEASE: 'verified',
      XANO_BOOKING_READS_RELEASE: 'verified',
      XANO_AGENT_TOOLS_RELEASE: 'verified',
      XANO_ASSESSMENTS_RELEASE: 'verified',
      ZOHO_READ_RELEASE: 'verified',
    },
    fetchImpl: async () => {
      upstreamCalls++;
      throw new Error('Unexpected upstream request from a sandbox-only route');
    },
  });

  const sandboxTools = [
    'zippy_get_booking',
    'zippy_validate_order',
    'zippy_check_vehicle_eligibility',
    'zippy_propose_assignment',
    'zippy_review_pod',
    'zippy_get_payment_summary',
    'zippy_prescreen_refund',
  ];
  for (const toolName of sandboxTools) {
    for (const method of ['GET', 'POST']) {
      const response = await handle({ method, url: `/api/agents/${toolName}` });
      assert.equal(response.status, 404, `${method} ${toolName} must not be routed`);
      assert.equal(response.data.error.code, 'ENDPOINT_UNAVAILABLE');
    }
  }

  for (const url of [
    '/api/mcp/zippy-agent-review',
    '/api/tools/zippy_get_booking',
    '/api/status?route=tools/zippy_prescreen_refund',
  ]) {
    const response = await handle({ method: 'POST', url });
    assert.equal(response.status, 404, url);
    assert.equal(response.data.error.code, 'ENDPOINT_UNAVAILABLE');
  }

  const status = await handle({ url: '/api/status' });
  assert.equal(status.status, 200);
  assert.equal(status.data.assessmentsAvailable, false);
  assert.equal(status.data.assessmentReviewAvailable, false);
  assert.equal(status.data.bookingWritesAvailable, false);
  assert.equal(status.data.deliveryAvailable, false);
  assert.equal(upstreamCalls, 0);
});
