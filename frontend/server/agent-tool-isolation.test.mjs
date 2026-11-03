import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

// A passing Xano tool-debug test is not authorization to expose its route to browsers.
// Verify both anonymous denial and the fall-through for a synthetic authenticated user.
test('sandbox agent tools remain inaccessible through the frontend gateway', async () => {
  const upstreamUrls = [];
  const authMe = 'https://isolated.invalid/api:auth/auth/me';
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
    fetchImpl: async (url) => {
      upstreamUrls.push(String(url));
      if (String(url) !== authMe) throw new Error('Unapproved tool/API forwarding');
      return new Response(JSON.stringify({
        id: 17,
        name: 'Synthetic Customer',
        email: 'synthetic@example.invalid',
        system_role: 'customer_member',
        status: 'active',
        active_organization_id: 42,
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
  const headers = new Headers({ Authorization: 'Bearer synthetic-test-token' });

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
    const anonymous = await handle({ url: `/api/agents/${toolName}` });
    assert.equal(anonymous.status, 401, `anonymous ${toolName} must be denied`);
    assert.equal(anonymous.data.error.code, 'AUTH_REQUIRED');

    for (const method of ['GET', 'POST']) {
      const response = await handle({ method, url: `/api/agents/${toolName}`, headers });
      assert.equal(response.status, 404, `${method} ${toolName} must not be routed`);
      assert.equal(response.data.error.code, 'ENDPOINT_UNAVAILABLE');
    }
  }

  for (const url of [
    '/api/mcp/zippy-agent-review',
    '/api/tools/zippy_get_booking',
    '/api/status?route=tools/zippy_prescreen_refund',
  ]) {
    const response = await handle({ method: 'POST', url, headers });
    assert.equal(response.status, 404, url);
    assert.equal(response.data.error.code, 'ENDPOINT_UNAVAILABLE');
  }

  const status = await handle({ url: '/api/status' });
  assert.equal(status.status, 200);
  assert.equal(status.data.assessmentsAvailable, false);
  assert.equal(status.data.assessmentReviewAvailable, false);
  assert.equal(status.data.bookingWritesAvailable, false);
  assert.equal(status.data.deliveryAvailable, false);
  assert.ok(upstreamUrls.length > 0);
  assert.ok(upstreamUrls.every(url => url === authMe), 'Only synthetic auth/me may be requested');
});
