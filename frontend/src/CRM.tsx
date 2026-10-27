import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Badge, Card, DetailRows, Dialog, EmptyState, Field, Notice, PageIntro } from './components';
import { api, ApiError } from './api';

type Module = { apiName: string; label: string; readOnly: boolean };
type RecordRow = { id: string; fields: Record<string, string | number | boolean | null>; orderLinks: string[] };

export default function CRM({ preview = false }: { preview?: boolean }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [detail, setDetail] = useState<RecordRow | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!preview);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (preview) return;
    let active = true;
    api<{ modules: Module[] }>('crm/modules').then(result => {
      if (active) { setModules(result.modules); setError(''); setLoading(false); }
    }).catch(e => { if (active) { setError(e.message); setLoading(false); setModules([]); setRows([]); } });
    return () => { active = false; };
  }, [preview, retry]);
  async function load(module: string, newPage: number) {
    setSelected(module); setPage(newPage); setRows([]); setNextPage(null); setError(''); setLoading(true); setQuery('');
    try {
      const result = await api<{ records: RecordRow[]; nextPage: number | null }>(`crm/records?module=${encodeURIComponent(module)}&page=${newPage}`);
      setRows(result.records); setNextPage(result.nextPage);
    } catch (e) { const error = e as ApiError; setError(`${error.message}${error.retryAfter ? ` Retry after ${error.retryAfter} seconds.` : ''}`); }
    finally { setLoading(false); }
  }
  async function open(id: string) {
    setError(''); setLoading(true);
    try { const result = await api<{ record: RecordRow }>(`crm/record?module=${encodeURIComponent(selected)}&id=${encodeURIComponent(id)}`); setDetail(result.record); }
    catch (e) { setError((e as Error).message); setRows([]); }
    finally { setLoading(false); }
  }
  const filtered = rows.filter(r => `${r.id} ${Object.values(r.fields).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageIntro title="Relationships that move business." subtitle="Authorized CRM records, with Zippy operations kept in context." eyebrow="ADMIN · CRM"/>
    <div className="mb-5"><Notice>Zippy/Xano remains authoritative for orders, collections, POD and holds. Zoho provides relationship information. This adapter is read-only.</Notice></div>
    {preview ? <Card title="Zoho connectivity"><EmptyState title="Zoho MCP authorization failed"><strong>Last recorded probe: HTTP 401.</strong> No available tenant modules were discovered. OAuth credentials and Xano Admin authorization are required for the REST adapter.</EmptyState><p className="px-6 pb-5 text-xs text-muted">Development previews do not authenticate against live CRM. Sign in through the secure application to discover authorized modules.</p></Card> : <Card title="Authorized modules" action={<Badge>Read-only</Badge>}>
      <div className="space-y-4 px-5 pb-5">
        {loading && <p role="status" className="text-sm">Loading authorized CRM data…</p>}
        {error && <div role="alert" className="rounded-lg bg-[#fcebed] p-4 text-sm text-danger">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Module filter"><select disabled={loading || !modules.length} value={selected} onChange={e => { if (e.target.value) void load(e.target.value, 1); }}><option value="">Select an available module</option>{modules.map(m => <option key={m.apiName} value={m.apiName}>{m.label}</option>)}</select></Field><Field label="Search this authorized page"><div className="flex items-center gap-2"><Search size={18}/><input disabled={loading} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search visible field values"/></div></Field></div>
        {!loading && !modules.length && !error && <EmptyState title="No modules available">Tenant module permissions and this account’s record grants must both permit access.</EmptyState>}
        {!loading && selected && !filtered.length && !error && <EmptyState title="No matching records on this page">Change the search or move to another authorized page.</EmptyState>}
        {filtered.map(r => <button className="route-tile block w-full" key={r.id} disabled={loading} onClick={() => void open(r.id)}><span className="block text-sm font-bold">{String(Object.values(r.fields).find(Boolean) || r.id)}</span><span className="mt-1 block text-xs text-muted">{r.id} · View authorized fields</span></button>)}
        <div className="flex flex-wrap gap-3"><button className="btn" disabled={loading} onClick={() => { setError(''); if (selected) void load(selected, page); else { setLoading(true); setRetry(retry + 1); } }}><RefreshCw size={16}/> Retry / refresh</button>{selected && <><button className="btn" disabled={loading || page <= 1} onClick={() => void load(selected, page - 1)}>Previous page</button><button className="btn" disabled={loading || !nextPage} onClick={() => nextPage && void load(selected, nextPage)}>Next page</button></>}</div>
        <p className="text-xs text-muted">Customer/company, lead, task and activity modules appear only when returned by Zoho and granted to this Admin. Search covers the current page of explicitly authorized records.</p>
      </div>
    </Card>}
    {detail && <Dialog title={`CRM record · ${detail.id}`} onClose={() => setDetail(null)}><DetailRows rows={Object.entries(detail.fields).map(([key, value]) => [key.replaceAll('_', ' '), value === null ? 'Not available' : String(value)])}/><Notice>Related Zippy orders: unavailable until a verified record-link and object-authorization contract is supplied.</Notice></Dialog>}
  </>;
}
