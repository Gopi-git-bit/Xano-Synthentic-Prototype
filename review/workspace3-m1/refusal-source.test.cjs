'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'refusal-candidates');
const expected = [
  "bookings_POST.xs",
  "bookings/_booking_id__PATCH.xs",
  "bookings/_booking_id_/cancel_POST.xs",
  "bookings/_booking_id_/confirm_POST.xs",
  "bookings/_booking_id_/consent-attempts_POST.xs",
  "bookings/_booking_id_/holds/_hold_id_/release_POST.xs",
  "bookings/_booking_id_/holds_POST.xs",
  "bookings/_booking_id_/payment-selection_POST.xs",
  "bookings/_booking_id_/quotes/_quote_id_/accept_POST.xs",
  "bookings/_booking_id_/quotes_POST.xs",
  "bookings/_booking_id_/resume_POST.xs",
  "consent-attempts/_attempt_id_/decision_POST.xs"
];
function gather(dir) {
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?gather(path.join(dir,e.name)):[path.join(dir,e.name)]);
}
test('review has exactly twelve non-deployable refusal source copies',()=>{
 const names=gather(root).map(p=>path.relative(root,p).split(path.sep).join('/')).sort();
 assert.deepEqual(names, [...expected].sort());
});
for(const rel of expected) test(rel+' refuses writes before side effects',()=>{
 const src=fs.readFileSync(path.join(root,rel), 'utf8');
 assert.match(src, /NOT DEPLOYABLE/);
 assert.match(src, /\bauth\s*=\s*"user"/);
 assert.match(src, /\bprecondition\s*\(false\)/);
 assert.match(src, /\berror_type\s*=\s*"accessdenied"/);
 assert.match(src, /Booking mutations are unavailable pending release review\./);
 assert.doesNotMatch(src, /\bguid\s*=/);
 assert.doesNotMatch(src, /\b(db\.|http\.|api\.|fetch\(|axios|sql\.|ai\.)/i);
 assert.doesNotMatch(src, /[A-Z]:\\|Users\\|password|secret|token/i);
});
