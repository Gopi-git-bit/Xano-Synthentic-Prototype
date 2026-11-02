import type { Booking, Order, Role } from '../types';

// Development-only, adapted from the published Zippy previews. Never backend records.
export const initialOrders: Order[] = [
  { id: 'ZP-2048', from: 'Chennai', to: 'Bengaluru', vehicle: '32 ft Container', date: '22 Oct 2026', status: 'In transit', payment: 'Succeeded', amount: 18500, paid: 12000, cargo: 'Industrial components', weight: '8.5', driver: 'K. Senthil', plate: 'TN 01 AB 2048', settlement: 'Not eligible', refund: 'Not requested', consent: 'Not requested', pod: 'Not submitted', invoice: 'Not issued' },
  { id: 'ZP-2047', from: 'Coimbatore', to: 'Chennai', vehicle: '14 ft Closed body', date: '22 Oct 2026', status: 'Confirmed', payment: 'Succeeded', amount: 14200, paid: 14200, cargo: 'Textiles', weight: '3.2', driver: 'Assignment pending', plate: '—', settlement: 'Not eligible', refund: 'Not requested', consent: 'Not requested', pod: 'Not submitted', invoice: 'Awaiting issuance' },
  { id: 'ZP-2046', from: 'Salem', to: 'Erode', vehicle: 'Tata Ace', date: '21 Oct 2026', status: 'Delivered', payment: 'Succeeded', amount: 4600, paid: 4600, cargo: 'Packaged goods', weight: '0.8', driver: 'K. Senthil', plate: 'TN 30 CK 6124', settlement: 'Awaiting review', refund: 'Not requested', consent: 'Not requested', pod: 'Submitted · awaiting verification', recipientConfirmation: 'Awaiting confirmation', invoice: 'Storage unavailable' },
  { id: 'ZP-2045', from: 'Tiruppur', to: 'Chennai', vehicle: '20 ft Open body', date: '21 Oct 2026', status: 'Delivered', payment: 'Unknown — reconcile', amount: 12600, paid: 0, cargo: 'Fabric rolls', weight: '6', driver: 'S. Kumar', plate: 'TN 39 AE 5100', settlement: 'On hold', refund: 'Not requested', consent: 'ToPay consent accepted', pod: 'Correction requested', recipientConfirmation: 'Awaiting confirmation', invoice: 'Not issued' },
  { id: 'ZP-2044', from: 'Hosur', to: 'Chennai', vehicle: '14 ft Closed body', date: '20 Oct 2026', status: 'Cancelled', payment: 'Failed', amount: 9800, paid: 0, cargo: 'Machinery parts', weight: '2', driver: 'Unassigned', plate: '—', settlement: 'Not eligible', refund: 'Review required' },
];

export const identities: Record<Role, { name: string; initials: string; account: string }> = {
  customer: { name: 'Gopinathan', initials: 'GP', account: 'Gopi Industries' },
  owner: { name: 'Southline Transport', initials: 'ST', account: 'Vehicle Owner workspace' },
  admin: { name: 'Operations team', initials: 'OP', account: 'Platform operations' },
};

export const navs: Record<Role, string[]> = {
  customer: ['Home', 'Book', 'Orders', 'Payments', 'Profile'],
  owner: ['Home', 'Jobs', 'Vehicles', 'Earnings', 'Profile'],
  admin: ['Home', 'All Orders', 'Participants', 'Fleet Visibility', 'Payments', 'Reviews & Holds', 'Incidents', 'Support', 'Announcements', 'CRM', 'Agent Responsibilities'],
};

export const tamil: Record<string, string> = {
  Home: 'முகப்பு', Book: 'பதிவு செய்', Orders: 'முன்பதிவுகள்', Jobs: 'பயணங்கள்', Vehicles: 'வாகனங்கள்',
  'Overview': 'கண்ணோட்டம்', 'Book Vehicle': 'வாகனம் பதிவு செய்', 'My Orders': 'எனது முன்பதிவுகள்',
  'Tracking': 'கண்காணிப்பு', 'Payments': 'கட்டணங்கள்', 'Documents': 'ஆவணங்கள்', 'Support': 'உதவி', 'Profile': 'சுயவிவரம்',
  'My Trips': 'எனது பயணங்கள்', 'Job Offers': 'பயண வாய்ப்புகள்', 'Incidents': 'சம்பவங்கள்', 'Earnings': 'வருவாய்',
  'My Fleet': 'எனது வாகனங்கள்', 'Authorized Drivers': 'அங்கீகரிக்கப்பட்ட ஓட்டுநர்கள்', 'Settlements': 'தீர்வுகள்',
};

// The only catalog entries evidenced by the published reference. No new rates/capacities inferred.
export const vehicles = ['Tata Ace', '14 ft Closed body', '20 ft Open body', '32 ft Container'];
export const cities = ['Chennai', 'Bengaluru', 'Coimbatore', 'Salem', 'Erode', 'Hosur', 'Tiruppur'];
export const emptyBooking: Booking = {
  from: '', to: '', pickup: '', delivery: '', sender: '', receiver: '', cargo: '', weight: '', dimensions: '',
  vehicle: vehicles[0], body: 'Closed', handling: 'Customer arranged', schedule: 'Immediate', when: '',
  mode: 'Full payment', payer: '', notes: '',
};

export const milestones = [
  { label: 'Booking confirmed', detail: 'Sample payment requirement met', time: '09:00 AM', state: 'done' },
  { label: 'Picked up in Chennai', detail: 'Cargo loaded & ready to go', time: '10:15 AM', state: 'done' },
  { label: 'On the road', detail: 'Illustrative location: Vellore', time: '01:45 PM', state: 'current' },
  { label: 'Arriving in Bengaluru', detail: 'Delivery & proof of delivery', time: 'ETA 06:30 PM', state: 'next' },
];

export const fleet = [
  { plate: 'TN 01 AB 2048', type: '32 ft Container', driver: 'K. Senthil', status: 'On trip', availability: 'Unavailable for new work' },
  { plate: 'TN 30 CK 6124', type: 'Tata Ace', driver: 'K. Senthil', status: 'Available', availability: 'Subject to eligibility checks' },
  { plate: 'TN 39 AE 5100', type: '20 ft Open body', driver: 'S. Kumar', status: 'Review required', availability: 'Document review pending' },
];

export const holds = [
  { id: 'ZP-2045', reason: 'Incomplete proof of delivery', action: 'Provider settlement release', owner: 'Operations · POD review', evidence: 'Clear recipient signature and delivery receipt', release: 'Authorized verification of corrected POD and Finance review', detail: 'The recipient signature is unclear. Delivery evidence is required before the settlement can be reviewed.' },
  { id: 'ZP-2044', reason: 'Payment reconciliation', action: 'Refund processing', owner: 'Finance / Compliance', evidence: 'Verified provider collection and reconciliation record', release: 'Eligible refundable balance, human approval and audit record', detail: 'No verified collection is recorded. A refund cannot be approved from this preview.' },
];
