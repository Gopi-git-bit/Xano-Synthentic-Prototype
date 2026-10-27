export type Role = 'customer' | 'owner' | 'admin';
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
// Presentation models only. Operational enums await the approved logistics contract.
export type OrderStatus = 'In transit' | 'Confirmed' | 'Delivered' | 'Cancelled' | 'Draft';
export type Order = {
  id: string; from: string; to: string; vehicle: string; date: string;
  status: OrderStatus; payment: 'Succeeded' | 'Pending' | 'Failed' | 'Not initiated' | 'Unknown — reconcile' | 'Restricted';
  amount: number | null; paid: number; cargo: string; weight: string;
  driver: string; plate: string; settlement: string; refund: string;
  consent?: string; pod?: string; recipientConfirmation?: string; invoice?: string;
};
export type Booking = {
  from: string; to: string; pickup: string; delivery: string; sender: string; receiver: string;
  cargo: string; weight: string; dimensions: string; vehicle: string; body: string; handling: string;
  schedule: string; when: string; mode: string; payer: string; notes: string;
};
export const money = (value: number | null) => value === null ? 'Awaiting quote' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
