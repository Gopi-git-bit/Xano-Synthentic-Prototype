import { useEffect, useId, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { Badge, Card, DetailRows, Dialog, EmptyState, Field, Notice, PageIntro } from './components';

type Booking = { id: number; booking_reference: string; status: string; payment_status: string; payment_mode: string | null; pickup_city: string; delivery_city: string; version: number };
type Page = { items: Booking[]; page: number; nextPage: number | null; readOnly: true };
type Detail = { booking: Booking; cargoCount: number; activeHoldCount: number; blockingReasons: string[]; readOnly: true };
type Query = { page: number; status: string };
type ReadRequest = { kind: 'page'; query: Query } | { kind: 'detail'; id: number };
const statusOptions = [['draft', 'Draft'], ['quoted', 'Quoted'], ['booked', 'Booked'], ['assigned', 'Assigned'], ['in_transit', 'In transit'], ['delivered', 'Delivered'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];

export default function Bookings({ available }: { available: boolean }) {
  const statusHint = useId();
  const [result, setResult] = useState<Page | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [query, setQuery] = useState<Query>({ page: 1, status: '' });
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<{ message: string; request: ReadRequest; retryAt: number } | null>(null);
  const [coolingDown, setCoolingDown] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => {
    if (!failure || !coolingDown) return;
    // A Retry-After timer only enables a manual retry; it never reads or confirms an outcome.
    const timer = window.setTimeout(() => setCoolingDown(false), Math.max(0, failure.retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [failure, coolingDown]);
  async function read(request: ReadRequest) {
    if (!available || coolingDown) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const current = () => activeRequest.current === controller && !controller.signal.aborted;
    setLoading(true); setFailure(null); setDetail(null);
    if (request.kind === 'page') { setQuery(request.query); setResult(null); }
    try {
      if (request.kind === 'page') {
        const params = new URLSearchParams({ page: String(request.query.page), ...(request.query.status ? { status: request.query.status } : {}) });
        const page = await api<Page>(`bookings?${params}`, undefined, { signal: controller.signal });
        if (current()) setResult(page);
      } else {
        const detail = await api<Detail>(`bookings/${request.id}`, undefined, { signal: controller.signal });
        if (current()) setDetail(detail);
      }
    } catch (e) {
      if (!current() || (e instanceof ApiError && e.code === 'REQUEST_CANCELLED')) return;
      setResult(null);
      const retryAfter = e instanceof ApiError && Number.isFinite(e.retryAfter) ? Math.max(0, Math.min(3600, e.retryAfter!)) : 0;
      setCoolingDown(retryAfter > 0);
      setFailure({ message: `${(e as Error).message}${retryAfter ? ` Retry after ${retryAfter} seconds.` : ''}`, request, retryAt: Date.now() + retryAfter * 1000 });
    } finally { if (current()) setLoading(false); }
  }
  return <><PageIntro title="Your organization’s bookings." subtitle="Read-only Xano records. Operational commands are awaiting release verification."/>
    <div className="mb-5"><Notice>Booking, payment, collection, consent, POD, refund and settlement states are separate. Delivery execution and financial actions are unavailable.</Notice></div>
    <Card title="Bookings" action={<Badge>Read-only</Badge>}><div className="space-y-4 p-5">
      {!available && <EmptyState title="Xano publication pending">The deployed booking handlers returned null at the last check. Implementations and authorization guards were found in unpublished drafts.</EmptyState>}
      <div className="space-y-2"><Field label="Booking status"><select aria-describedby={statusHint} disabled={!available || coolingDown} value={query.status} onChange={event => void read({ kind: 'page', query: { page: 1, status: event.target.value } })}><option value="">All booking states</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><p id={statusHint} className="text-xs text-muted">Filters booking lifecycle only. Payment, collection and POD remain separate.</p></div>
      {failure && <div role="alert" className="space-y-3 text-sm text-danger"><p>{failure.message}</p><button className="btn" disabled={!available || loading || coolingDown} onClick={() => void read(failure.request)}>Retry booking read</button></div>}
      {loading && <p role="status" className="text-sm">Reading authorized bookings…</p>}
      {available && !result && !loading && !failure && <EmptyState title="Load your bookings">Read the authorized Xano page for your organization. No sample records are substituted.</EmptyState>}
      {result?.items.map(row => <button className="route-tile block w-full text-left" disabled={loading || coolingDown} key={row.id} onClick={() => void read({ kind: 'detail', id: row.id })}><span className="block font-bold">{row.booking_reference}</span><span className="block text-sm">{row.pickup_city} → {row.delivery_city}</span><span className="text-xs text-muted">Booking: {row.status} · Payment: {row.payment_status}</span></button>)}
      {result && !result.items.length && <EmptyState title="No bookings on this authorized page">Xano returned a verified empty page for your organization{query.status ? ` with booking state ${query.status}` : ''}.</EmptyState>}
      {available && <p className="text-xs text-muted" aria-live="polite">{result ? `Page ${result.page} · ${result.items.length} booking${result.items.length === 1 ? '' : 's'} on this page` : `Requested page ${query.page}`} · {query.status || 'All booking states'}</p>}
      <div className="flex flex-wrap gap-3"><button className="btn" disabled={!available || loading || coolingDown} onClick={() => void read({ kind: 'page', query })}>{available ? 'Load / refresh bookings' : 'Booking reads unavailable'}</button>{available && <><button className="btn" disabled={loading || coolingDown || query.page <= 1} onClick={() => void read({ kind: 'page', query: { ...query, page: query.page - 1 } })}>Previous page</button><button className="btn" disabled={loading || coolingDown || !result?.nextPage} onClick={() => result?.nextPage && void read({ kind: 'page', query: { ...query, page: result.nextPage } })}>Next page</button></>}</div>
    </div></Card>
    {detail && <Dialog title={detail.booking.booking_reference} onClose={() => setDetail(null)}><DetailRows rows={[
      ['Booking state', detail.booking.status], ['Payment state reported by Xano', detail.booking.payment_status], ['Payment selection', detail.booking.payment_mode || 'Not selected'], ['Cargo items', detail.cargoCount], ['Active holds', detail.activeHoldCount], ['Version', detail.booking.version], ['Collection / consent / POD / refund / settlement', 'Not connected'],
    ]}/>{detail.blockingReasons.map((reason, index) => <Notice key={index}>{reason}</Notice>)}<Notice>This is a read-only record. No booking, collection, delivery or settlement action has been submitted.</Notice></Dialog>}
  </>;
}
