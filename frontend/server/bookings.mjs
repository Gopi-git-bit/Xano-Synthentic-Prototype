// Projection for the discovered workspace-3 draft read contract. Publication is gated separately.
export const bookingStatuses = ['draft', 'quoted', 'booked', 'assigned', 'in_transit', 'delivered', 'completed', 'cancelled'];
const positiveId = value => Number.isSafeInteger(value) && value > 0;
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 500;
const invalid = fail => fail(502, 'BOOKING_CONTRACT_INVALID', 'Xano booking response needs verification. No booking outcome is confirmed.');

function booking(row, user, fail) {
  if (!row || !positiveId(row.id) || !positiveId(row.customer_organization_id) || !positiveId(row.version) || !text(row.booking_reference) || !text(row.pickup_city) || !text(row.delivery_city) || !bookingStatuses.includes(row.status) || !['pending', 'authorized', 'paid_escrow', 'settled', 'refunded', 'failed'].includes(row.payment_status) || !['prepaid', 'topay', 'credit', null].includes(row.payment_mode)) invalid(fail);
  // Defense in depth; active membership must ALSO be enforced by the published Xano handler.
  if (row.customer_organization_id !== user.organizationId) fail(403, 'BOOKING_SCOPE_DENIED', 'This booking is outside your authorized organization.');
  return Object.fromEntries(['id', 'booking_reference', 'status', 'payment_status', 'payment_mode', 'pickup_city', 'delivery_city', 'version'].map(key => [key, row[key]]));
}

export function bookingPage(data, user, page, perPage, fail) {
  if (!data || !Array.isArray(data.items) || data.items.length > perPage || data.curPage !== page || !(data.nextPage === null || (positiveId(data.nextPage) && data.nextPage === page + 1))) invalid(fail);
  const items = data.items.map(row => booking(row, user, fail));
  if (new Set(items.map(row => row.id)).size !== items.length) invalid(fail);
  return { items, page, nextPage: data.nextPage, readOnly: true };
}

export function bookingDetail(data, user, id, fail) {
  if (!data || !Array.isArray(data.cargo) || !Array.isArray(data.active_holds) || !Array.isArray(data.blocking_reasons) || data.blocking_reasons.length > 100 || !data.blocking_reasons.every(text) || !Array.isArray(data.allowed_actions) || !data.allowed_actions.every(text)) invalid(fail);
  const result = booking(data.booking, user, fail);
  if (result.id !== id) invalid(fail);
  // Do not expose raw cargo/contact/financial objects or turn reported actions into command grants.
  return { booking: result, cargoCount: data.cargo.length, activeHoldCount: data.active_holds.length, blockingReasons: data.blocking_reasons, readOnly: true };
}
