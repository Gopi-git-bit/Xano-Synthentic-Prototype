// Server-only attestation. Reverify identity, data, definitions and expiry before changing this pin.
export const sandboxTarget = Object.freeze({
  origin: 'https://xynd-fnea-khtp.n7e.xano.io',
  tenant: 'evce-n7wl-552a', tenantId: 7, workspaceId: 1, branch: 'v1',
  expiresAt: Date.parse('2026-11-05T17:20:21Z'),
  backendCommit: '4421892ff9c884e43711753cacde04efd4ddb7c6',
  authGroup: 'zippy-customer-draft-auth', bookingsGroup: 'zippy-customer-drafts',
});
export const sandboxBranch = 'feat/protected-customer-xano-20261103';