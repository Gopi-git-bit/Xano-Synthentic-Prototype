import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Badge, Card, DetailRows, Dialog, EmptyState, Field, Notice, PageIntro } from './components';
import { api, ApiError, type ServiceStatus } from './api';

type Module = { apiName: string; label: string; readOnly: boolean };
type RecordRow = { id: string; fields: Record<string, string | number | boolean | null>; orderLinks: string[] };
type ReadRequest = { kind: 'connect' } | { kind: 'page'; module: string; page: number } | { kind: 'detail'; module: string; id: string };

export default function CRM({ preview = true }: { preview?: boolean }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<RecordRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [detail, setDetail] = useState<RecordRow | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!preview);
  const [request, setRequest] = useState<ReadRequest>({ kind: 'connect' });
  const [retryRequest, setRetryRequest] = useState<ReadRequest>({ kind: 'connect' });
  const [retryAt, setRetryAt] = useState(0);
  const [coolingDown, setCoolingDown] = useState(false);
  useEffect(() => {
    if (!coolingDown) return;
    // Expiry enables manual retry; it never triggers another provider request.
    const timer = window.setTimeout(() => setCoolingDown(false), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [coolingDown, retryAt]);
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    async function run() {
      try {
        if (request.kind === 'connect') {
          const status = await api<ServiceStatus>('status', undefined, options);
          if (!status.crmConfigured || !status.crmReleaseAuthorized || !status.crmConnectionVerified || !status.crmAvailable) {
            throw new ApiError('ZOHO_RELEASE_PENDING', 'Server REST configuration, verified Admin access and release authorization are required. MCP connectivity is independent.');
          }
          const result = await api<{ modules: Module[] }>('crm/modules', undefined, options);
          if (!controller.signal.aborted) { setModules(result.modules); setConnected(true); }
        } else if (request.kind === 'page') {
          const result = await api<{ records: RecordRow[]; nextPage: number | null }>(`crm/records?module=${encodeURIComponent(request.module)}&page=${request.page}`, undefined, options);
          if (!controller.signal.aborted) { setRows(result.records); setNextPage(result.nextPage); }
        } else {
          const result = await api<{ record: RecordRow }>(`crm/record?module=${encodeURIComponent(request.module)}&id=${encodeURIComponent(request.id)}`, undefined, options);
          if (!controller.signal.aborted) setDetail(result.record);
        }
      } catch (e) {
        if (controller.signal.aborted || (e instanceof ApiError && e.code === 'REQUEST_CANCELLED')) return;
        const denied = e instanceof ApiError && ['ADMIN_REQUIRED', 'ACCESS_DENIED', 'CRM_SCOPE_REQUIRED', 'CRM_SCOPE_DENIED', 'CRM_SCOPE_CHANGED', 'MODULE_UNAVAILABLE', 'CRM_FIELDS_DENIED', 'ZOHO_RELEASE_PENDING', 'ZOHO_ACCESS_DENIED', 'ZOHO_NOT_CONFIGURED', 'ZOHO_CONFIG_INVALID', 'ZOHO_REFRESH_FAILED', 'GRANTS_INVALID'].includes(e.code);
        if (denied || request.kind === 'connect') { setModules([]); setConnected(false); }
        setRows(null); setDetail(null); setNextPage(null);
        const delay = e instanceof ApiError && Number.isFinite(e.retryAfter) ? Math.max(0, Math.min(3600, e.retryAfter!)) : 0;
        setCoolingDown(delay > 0); setRetryAt(Date.now() + delay * 1000);
        setError(`${(e as Error).message}${delay ? ` Retry after ${delay} seconds.` : ''}`);
        setRetryRequest(denied ? { kind: 'connect' } : request);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void run();
    return () => controller.abort();
  }, [preview, request]);
  function read(next: ReadRequest) {
    if (preview || coolingDown) return;
    setLoading(true); setError(''); setDetail(null); setRows(null); setNextPage(null);
    if (next.kind === 'connect') { setModules([]); setConnected(false); setSelected(''); setPage(1); }
    if (next.kind === 'page') { setSelected(next.module); setPage(next.page); setQuery(''); }
    setRequest({ ...next });
  }
  const filtered = rows?.filter(r => `${r.id} ${Object.values(r.fields).join(' ')}`.toLowerCase().includes(query.toLowerCase())) || [];
  return <><PageIntro title="Relationships that move business." subtitle="Authorized CRM records, with Zippy operations kept in context." eyebrow="ADMIN · CRM"/>
    <div className="mb-5"><Notice>Zippy/Xano remains authoritative for orders, collections, POD and holds. Zoho provides relationship information. This adapter is read-only.</Notice></div>
    <Card title={connected ? 'Authorized modules' : 'Zoho connectivity'} action={<Badge>Read-only</Badge>}><div className="space-y-4 px-5 pb-5">
      {loading && <p role="status" className="text-sm">Loading authorized CRM data…</p>}
      {error && <div role="alert" className="rounded-lg bg-[#fcebed] p-4 text-sm text-danger">{error}</div>}
      {!connected && !loading && <EmptyState title="Zoho is unavailable">{preview ? 'This development preview does not access CRM records.' : 'CRM reads need server-verified access and explicit record and field grants. No CRM records are displayed.'}</EmptyState>}
      {connected && <>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Module filter"><select disabled={coolingDown || !modules.length} value={selected} onChange={e => { if (e.target.value) read({ kind: 'page', module: e.target.value, page: 1 }); }}><option value="" disabled>Select an available module</option>{modules.map(m => <option key={m.apiName} value={m.apiName}>{m.label}</option>)}</select></Field><Field label="Search this authorized page"><div className="flex items-center gap-2"><Search size={18}/><input disabled={loading || !rows} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search visible field values"/></div></Field></div>
        {!loading && !modules.length && !error && <EmptyState title="No modules available">Tenant module permissions and this account’s record grants must both permit access.</EmptyState>}
        {!loading && rows && !filtered.length && !error && <EmptyState title="No matching records on this page">Change the search or move to another authorized page.</EmptyState>}
        {filtered.map(r => <button className="route-tile block w-full text-left" key={r.id} disabled={loading || coolingDown} onClick={() => read({ kind: 'detail', module: selected, id: r.id })}><span className="block text-sm font-bold">{String(Object.values(r.fields).find(value => value !== null && value !== '') ?? r.id)}</span><span className="mt-1 block text-xs text-muted">{r.id} · View authorized fields</span></button>)}
        {selected && <p className="text-xs text-muted" aria-live="polite">{rows ? `Page ${page} · ${rows.length} authorized records on this page` : `Requested page ${page}`} · {selected}</p>}
      </>}
      {!preview && <div className="flex flex-wrap gap-3">
        <button className="btn" disabled={loading || coolingDown} onClick={() => read(error ? retryRequest : selected && connected ? { kind: 'page', module: selected, page } : { kind: 'connect' })}><RefreshCw size={16}/>{error ? 'Retry CRM read' : 'Refresh CRM'}</button>
        {connected && <button className="btn" disabled={loading || coolingDown} onClick={() => read({ kind: 'connect' })}>Recheck CRM access</button>}
        {connected && selected && <><button className="btn" disabled={loading || coolingDown || page <= 1} onClick={() => read({ kind: 'page', module: selected, page: page - 1 })}>Previous page</button><button className="btn" disabled={loading || coolingDown || !nextPage} onClick={() => nextPage && read({ kind: 'page', module: selected, page: nextPage })}>Next page</button></>}
      </div>}
      <p className="text-xs text-muted">Modules appear only when returned by Zoho and granted to this Admin. Search covers the current page of explicitly authorized records.</p>
    </div></Card>
    {detail && <Dialog title={`CRM record · ${detail.id}`} onClose={() => setDetail(null)}><DetailRows rows={Object.entries(detail.fields).map(([key, value]) => [key.replaceAll('_', ' '), value === null ? 'Not available' : String(value)])}/><Notice>Related Zippy orders: unavailable until a verified record-link and object-authorization contract is supplied.</Notice></Dialog>}
  </>;
}
