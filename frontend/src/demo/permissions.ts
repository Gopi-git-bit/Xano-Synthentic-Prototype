import type { Order } from '../types';
import { fleet } from './data';

// Explicit DEVELOPMENT fixtures, not production roles or a proposed backend contract.
export const scenarios = {
  ownerDriver: { label: 'Owner-driver', execute: true, evidence: true, manage: true, finance: true, orders: ['ZP-2048', 'ZP-2046'], vehicles: ['TN 01 AB 2048', 'TN 30 CK 6124'] },
  salaried: { label: 'Salaried driver', execute: true, evidence: true, manage: false, finance: false, orders: ['ZP-2048'], vehicles: ['TN 01 AB 2048'] },
  fleetOwner: { label: 'Fleet owner', execute: false, evidence: true, manage: true, finance: true, orders: ['ZP-2048', 'ZP-2046', 'ZP-2045'], vehicles: fleet.map(v => v.plate) },
};
export type Scenario = keyof typeof scenarios;
export function scopedOwnerOrders(orders: Order[], scenario: Scenario) {
  const grant = scenarios[scenario];
  return orders.filter(o => grant.orders.includes(o.id)).map(o => grant.finance ? o : { ...o, amount: null, paid: 0, payment: 'Restricted' as const, consent: undefined, settlement: 'Restricted', refund: 'Restricted', invoice: undefined });
}
