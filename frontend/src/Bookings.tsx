import { useState } from 'react';
import { api } from './api';
import { Badge, Card, DetailRows, Dialog, EmptyState, Notice, PageIntro } from './components';

type Booking = { id: number; booking_reference: string; status: string; payment_status: string; payment_mode: string | null; pickup_city: string; delivery_city: string; version: number };
type Page = { items: Booking[]; page: number; nextPage: number | null; readOnly: true };
type Detail = { booking: Booking; cargoCount: number; activeHoldCount: number; blockingReasons: string[]; readOnly: true };

export default function Bookings({ available }: { available: boolean }) {
  const [result, setResult] = useState<Page | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function load(page = 1) {
    setLoading(true); setError(''); setResult(null); setDetail(null);
    try { setResult(await api<Page>(`bookings?page=${page}`)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  async function open(id: number) {
    setLoading(true); setError(''); setDetail(null);
    try { setDetail(await api<Detail>(`bookings/${id}`)); }
    catch (e) { setError((e as Error).message); setResult(null); }
    finally { setLoading(false); }
  }
  return <><PageIntro title="Your organization’s bookings." subtitle="Read-only Xano records. Operational commands are awaiting release verification."/>
    <div className="mb-5"><Notice>Booking, payment, collection, consent, POD, refund and settlement states are separate. Delivery execution and financial actions are unavailable.</Notice></div>
    <Card title="Bookings" action={<Badge>Read-only</Badge>}><div className="space-y-4 p-5">
      {!available && <EmptyState title="Xano publication pending">The deployed booking handlers returned null at the last check. Implementations and authorization guards were found in unpublished drafts.</EmptyState>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {loading && <p role="status" className="text-sm">Reading authorized bookings…</p>}
      {result?.items.map(row => <button className="route-tile block w-full text-left" disabled={loading} key={row.id} onClick={() => void open(row.id)}><span className="block font-bold">{row.booking_reference}</span><span className="block text-sm">{row.pickup_city} → {row.delivery_city}</span><span className="text-xs text-muted">Booking: {row.status} · Payment: {row.payment_status}</span></button>)}
      {result && !result.items.length && <EmptyState title="No bookings on this authorized page">Xano returned a verified empty page for your organization.</EmptyState>}
      <div className="flex flex-wrap gap-3"><button className="btn" disabled={!available || loading} onClick={() => void load()}>{available ? 'Load / refresh bookings' : 'Booking reads unavailable'}</button>{result && <><button className="btn" disabled={loading || result.page <= 1} onClick={() => void load(result.page - 1)}>Previous page</button><button className="btn" disabled={loading || !result.nextPage} onClick={() => result.nextPage && void load(result.nextPage)}>Next page</button></>}</div>
    </div></Card>
    {detail && <Dialog title={detail.booking.booking_reference} onClose={() => setDetail(null)}><DetailRows rows={[
      ['Booking state', detail.booking.status], ['Payment state reported by Xano', detail.booking.payment_status], ['Payment selection', detail.booking.payment_mode || 'Not selected'], ['Cargo items', detail.cargoCount], ['Active holds', detail.activeHoldCount], ['Version', detail.booking.version], ['Collection / consent / POD / refund / settlement', 'Not connected'],
    ]}/>{detail.blockingReasons.map((reason, index) => <Notice key={index}>{reason}</Notice>)}<Notice>This is a read-only record. No booking, collection, delivery or settlement action has been submitted.</Notice></Dialog>}
  </>;
}
