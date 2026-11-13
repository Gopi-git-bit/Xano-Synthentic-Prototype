import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Clock3, LockKeyhole, LogOut, MapPin, Plus, ShieldCheck, Truck } from 'lucide-react';
import { Badge, Card, Field, Notice } from '../components';
import { createCustomerApi, SandboxApiError, type DraftInput, type SandboxSession } from './customer-api';

type Screen = 'register' | 'login' | 'home' | 'draft' | 'orders' | 'detail';
type Account = { name: string; organization: string; email: string };
type Draft = { id: number; reference: string; pickupCity: string; pickupStreet?: string; deliveryCity: string; deliveryStreet?: string; version: number };

const localDate = (days: number, hours = 0) => {
  const date = new Date(Date.now() + days * 86400000 + hours * 3600000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyRoute = () => ({
  pickupCity: '', pickupStreet: '', deliveryCity: '', deliveryStreet: '',
  pickupStart: localDate(1), pickupEnd: localDate(1, 2),
  deliveryStart: localDate(2), deliveryEnd: localDate(2, 2),
});

export default function CustomerPreview({ connected = false }: { connected?: boolean }) {
  const [screen, setScreen] = useState<Screen>('register');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const credential = useRef<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [session, setSession] = useState(false);
  const [route, setRoute] = useState(emptyRoute);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [api] = useState(createCustomerApi);
  const [pendingDraft, setPendingDraft] = useState<{ signature: string; input: DraftInput } | null>(null);

  function applySession(value: SandboxSession) {
    setAccount({ name: value.user.name, organization: value.organization.name, email: value.user.email });
    setSession(true); setExpiresAt(value.expiresAt);
  }
  useEffect(() => {
    if (!connected) return;
    let stopped = false;
    void api.identity().then(value => {
      if (!stopped) { applySession(value); setScreen('home'); }
    }).catch(error => { if (!stopped && (!(error instanceof SandboxApiError) || error.status !== 401)) setError('Protected sandbox is unavailable. Check preview access and configuration.'); });
    return () => { stopped = true; };
  }, [api, connected]);
  useEffect(() => {
    if (!connected || !expiresAt) return;
    const timer = window.setTimeout(() => {
      setSession(false); setAccount(null); setDrafts([]); setSelected(null); setScreen('login');
      setPassword(''); setLoginPassword(''); setRoute(emptyRoute()); setPendingDraft(null);
      setNotice('Sandbox session expired. Sign in again.'); setExpiresAt(null);
    }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [connected, expiresAt]);
  function failure(error: unknown) {
    setError(error instanceof SandboxApiError ? error.message : 'The sandbox request could not be completed.');
    if (error instanceof SandboxApiError && [401, 403].includes(error.status)) {
      setSession(false); setAccount(null); setDrafts([]); setSelected(null); setScreen('login');
      setExpiresAt(null); setPendingDraft(null); setRoute(emptyRoute());
    }
  }

  const navigate = (next: Screen) => {
    setError(''); setNotice(''); setScreen(next);
    if (connected && next === 'orders') {
      setBusy(true); void api.list().then(page => setDrafts(page.items)).catch(failure).finally(() => setBusy(false));
    }
  };
  function reset(expired = false) {
    credential.current = null;
    setSession(false); setAccount(null); setDrafts([]); setSelected(null);
    setName(''); setOrganization(''); setEmail(''); setPassword(''); setLoginPassword('');
    setRoute(emptyRoute()); setError(''); setScreen('register'); setExpiresAt(null); setPendingDraft(null);
    setNotice(expired ? 'Synthetic session expired; all in-memory data was cleared.' : 'Synthetic session cleared.');
  }
  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if (!/^SYNTHETIC\s+\S/i.test(name.trim()) || !/^SYNTHETIC\s+\S/i.test(organization.trim())
      || !/^[\w.+-]+@example\.invalid$/i.test(email.trim()) || password.length < 12) {
      setError('Use SYNTHETIC names, an @example.invalid email and a test password of at least 12 characters.');
      return;
    }
    if (connected) {
      setBusy(true);
      try {
        await api.register({ name: name.trim(), organization_name: organization.trim(), email: email.trim().toLowerCase(), password });
        setNotice('Sandbox registration completed. Organization verification is pending human review.'); setScreen('login');
      } catch (error) { failure(error); } finally { setPassword(''); setBusy(false); }
      return;
    }
    credential.current = password;
    setPassword('');
    setAccount({ name: name.trim(), organization: organization.trim(), email: email.trim().toLowerCase() });
    setNotice('Synthetic registration prepared. Human organization verification would still be pending.');
    setScreen('login');
  }
  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if (connected) {
      setBusy(true);
      try {
        await api.login(email.trim().toLowerCase(), loginPassword);
        const identity = await api.identity(), membership = await api.membership();
        if (identity.organization.id !== membership.organization.id) throw new SandboxApiError(403, 'Organization access changed. Sign in again.');
        applySession(membership); setDrafts((await api.list()).items); setScreen('home');
        setNotice('Authenticated sandbox login successful. Active customer organization and owner membership verified.');
      } catch (error) { failure(error); } finally { setLoginPassword(''); setBusy(false); }
      return;
    }
    if (!account || email.trim().toLowerCase() !== account.email || loginPassword !== credential.current) {
      setError('Synthetic email or test password does not match.');
      return;
    }
    credential.current = null; setLoginPassword(''); setSession(true); setScreen('home');
    setNotice('In-memory synthetic session started. No external API was contacted.');
  }
  async function saveDraft(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if (!session || !account) { reset(true); return; }
    const r = route;
    if ([r.pickupCity, r.pickupStreet, r.deliveryCity, r.deliveryStreet].some(x => x.trim().length < 2)
      || (r.pickupCity.toLowerCase() === r.deliveryCity.toLowerCase() && r.pickupStreet.toLowerCase() === r.deliveryStreet.toLowerCase())) {
      setError('Enter different pickup and delivery locations with a city and street.');
      return;
    }
    const times = [r.pickupStart, r.pickupEnd, r.deliveryStart, r.deliveryEnd].map(x => new Date(x).getTime());
    if (times.some(x => !Number.isFinite(x)) || times[0] <= Date.now() || times[0] >= times[1] || times[1] > times[2] || times[2] >= times[3]) {
      setError('Select future, ordered pickup and delivery time windows.');
      return;
    }
    if (connected) {
      setBusy(true);
      const payload = { pickup_city: r.pickupCity.trim(), pickup_street: r.pickupStreet.trim(), delivery_city: r.deliveryCity.trim(), delivery_street: r.deliveryStreet.trim(),
        pickup_window_start: times[0], pickup_window_end: times[1], delivery_window_start: times[2], delivery_window_end: times[3] };
      const signature = JSON.stringify(payload);
      const attempt = pendingDraft?.signature === signature ? pendingDraft : { signature, input: { request_id: crypto.randomUUID(), ...payload } };
      setPendingDraft(attempt);
      try {
        await api.createDraft(attempt.input);
        setDrafts((await api.list()).items); setPendingDraft(null); setRoute(emptyRoute()); setScreen('orders');
        setNotice('Draft saved and retrieved from isolated Xano. No quote, payment or dispatch was created.');
      } catch (error) { failure(error); } finally { setBusy(false); }
      return;
    }
    const id = drafts.length + 1;
    const draft: Draft = { id, reference: 'SYN-DRAFT-' + String(id).padStart(3, '0'), version: 1,
      pickupCity: r.pickupCity, pickupStreet: r.pickupStreet, deliveryCity: r.deliveryCity, deliveryStreet: r.deliveryStreet };
    setDrafts(old => [draft, ...old]); setRoute(emptyRoute()); setScreen('orders');
    setNotice('Synthetic draft saved in browser memory only. No quote, payment or dispatch was created.');
  }
  const active = session && account !== null;
  async function logout() {
    if (!connected) { reset(); return; }
    setBusy(true);
    try { await api.logout(); reset(); setNotice('Signed out. The server session was revoked.'); }
    catch (error) { failure(error); } finally { setBusy(false); }
  }
  async function detail(draft: Draft) {
    if (!connected) { setSelected(draft); navigate('detail'); return; }
    setBusy(true);
    try { setSelected((await api.detail(draft.id)).booking); navigate('detail'); }
    catch (error) { failure(error); } finally { setBusy(false); }
  }
  const field = (label: string, key: keyof ReturnType<typeof emptyRoute>, type = 'text') => (
    <Field label={label}><input type={type} required disabled={busy} maxLength={200} value={route[key]} onChange={e => { setError(''); setRoute(old => ({ ...old, [key]: e.target.value })); }}/></Field>
  );

  return <main data-role="customer" data-sandbox-preview={connected ? 'xano-gateway' : 'synthetic-only'} aria-busy={busy} className="min-h-dvh bg-canvas text-ink">
    <a className="skip" href="#preview-main">Skip to sandbox content</a>
    <div role="status" className="bg-[#e6f2e7] px-3 py-2 text-center text-[11px] font-bold text-[#255d3e]">
      {connected ? 'PROTECTED XANO SANDBOX · SYNTHETIC CUSTOMERS · DRAFTS ONLY' : 'SYNTHETIC BROWSER REHEARSAL · NO LIVE XANO REQUESTS · NO REAL BOOKINGS'}
    </div>
    <div className="mx-auto grid max-w-[1400px] lg:min-h-[calc(100dvh-36px)] lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="bg-nav p-5 text-white lg:flex lg:flex-col lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="brand"><span className="brand-mark">z</span><span className="text-xl font-extrabold">zippy <span className="block text-[9px] font-semibold tracking-[.3em] text-white/60">LOGISTICS</span></span></div><span className="rounded-lg border border-white/20 px-2 py-1 text-[10px]">PREVIEW</span></div>
        <div className="mt-6 hidden rounded-xl border border-white/15 bg-white/5 p-4 lg:block"><ShieldCheck size={22}/><p className="mt-3 text-sm font-bold">Safe by design</p><p className="mt-2 text-xs leading-relaxed text-white/70">{connected ? 'Synthetic accounts and drafts in isolated Xano. Protected server sessions; no payment or dispatch.' : 'In-memory accounts and draft bookings only. No payment, dispatch or provider connection.'}</p></div>
        <nav aria-label="Sandbox customer navigation" className="mt-5 flex flex-wrap gap-2 lg:flex-col">
          {active ? [
            ['home', 'Overview'], ['draft', 'Create draft'], ['orders', 'My drafts'],
          ].map(([step, label]) => <button key={step} disabled={busy} className="sidebar-link" aria-current={screen === step ? 'page' : undefined} onClick={() => navigate(step as Screen)}>{label}</button>)
            : <span className="text-xs text-white/75">Customer onboarding preview</span>}
        </nav>
        <div className="mt-5 hidden border-t border-white/15 pt-5 text-xs lg:mt-auto lg:block">{active ? account.organization : 'Synthetic customer environment'}</div>
      </aside>
      <div id="preview-main" className="min-w-0 p-4 sm:p-7 lg:p-10" tabIndex={-1}>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-muted"><Truck size={17} className="text-brand"/> Customer / Isolated preview</span>{active ? <div className="flex flex-wrap gap-2">{!connected && <button className="btn" onClick={() => reset(true)} aria-label="Expire synthetic session"><Clock3 size={16}/> Expire test session</button>}<button className="btn" disabled={busy} onClick={() => void logout()}><LogOut size={16}/> Sign out</button></div> : <Badge tone="warning">No active session</Badge>}</header>
        <div className="mb-7 max-w-2xl"><p className="eyebrow">DRAFT-ONLY CUSTOMER WORKFLOW</p><h1 className="text-[28px] font-extrabold tracking-tight sm:text-[36px]">{screen === 'register' ? 'Start your freight journey.' : screen === 'login' ? 'Welcome back to Zippy.' : screen === 'home' ? 'Your next move, made simple.' : screen === 'draft' ? 'Create a freight draft.' : screen === 'orders' ? 'Your saved drafts.' : 'Draft booking details.'}</h1><p className="mt-2 text-sm leading-relaxed text-muted">{connected ? 'Protected browser-to-Xano sandbox with synthetic data.' : 'This page rehearses the approved sandbox workflow with synthetic data.'} Confirmation, payment and dispatch remain unavailable.</p>{connected && active && <p className="mt-2 text-sm font-semibold" data-testid="active-organization">Active customer organization: {account.organization}</p>}</div>
        {notice && <div role="status" className="notice mb-5">{notice}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-[#e9bcbc] bg-[#fcebed] p-4 text-sm text-danger">{error}</div>}

        {screen === 'register' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(220px,.8fr)]">
          <Card><form aria-label="Synthetic customer registration" className="space-y-5 p-5 sm:p-7" onSubmit={register}><h2 className="font-bold">Prepare a synthetic customer</h2><div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name"><input required maxLength={100} placeholder="SYNTHETIC Customer" value={name} onChange={e=>setName(e.target.value)}/></Field>
            <Field label="Organization name"><input required maxLength={200} placeholder="SYNTHETIC Freight Ltd" value={organization} onChange={e=>setOrganization(e.target.value)}/></Field>
            <Field label="Test email"><input required type="email" autoComplete="off" placeholder="synthetic@example.invalid" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
            <Field label="Test password"><input required type="password" autoComplete="new-password" minLength={12} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} /></Field>
          </div><p className="text-xs text-muted">Only SYNTHETIC names and @example.invalid addresses are accepted.</p><button className="btn primary" type="submit" disabled={busy}>Continue to sign in <ArrowRight size={16}/></button>{connected && <button type="button" className="text-btn ml-3" disabled={busy} onClick={() => navigate('login')}>Existing sandbox account</button>}</form></Card>
          <Card><div className="space-y-4 p-5"><ShieldCheck size={26} className="text-brand"/><h2 className="font-bold">Human review remains required</h2><p className="text-sm leading-relaxed text-muted">{connected ? 'Registration creates a synthetic customer and pending onboarding review in isolated Xano. Verification is not approved automatically.' : 'The real Xano flow queues an onboarding review. This preview does not approve verification or create a real account.'}</p><Badge tone="warning">Verification pending</Badge></div></Card>
        </div>}

        {screen === 'login' && <Card className="max-w-xl"><form aria-label="Synthetic customer sign in" className="space-y-5 p-6 sm:p-8" onSubmit={signIn}><LockKeyhole size={26} className="text-brand"/><h2 className="font-bold">Sign in to your test workspace</h2>
          <Field label="Test email"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Test password"><input required type="password" autoComplete="off" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)}/></Field>
          <button className="btn primary w-full" type="submit" disabled={busy}>Sign in</button><button type="button" className="text-btn" disabled={busy} onClick={()=>reset()}>Start a new synthetic registration</button>
        </form></Card>}

        {active && screen === 'home' && <><div className="grid gap-4 sm:grid-cols-3">
          <Card><div className="p-5"><p className="text-xs text-muted">Draft bookings</p><p className="mt-2 text-3xl font-extrabold">{String(drafts.length).padStart(2, '0')}</p></div></Card>
          <Card><div className="p-5"><p className="text-xs text-muted">Organization verification</p><div className="mt-4"><Badge tone="warning">Pending review</Badge></div></div></Card>
          <Card><div className="p-5"><p className="text-xs text-muted">Payment status</p><div className="mt-4"><Badge tone="neutral">Unavailable</Badge></div></div></Card>
        </div><Card className="mt-5"><div className="flex flex-wrap items-center justify-between gap-5 p-6"><div><h2 className="text-xl font-bold">Prepare a freight draft</h2><p className="mt-2 text-sm text-muted">Add pickup, delivery and scheduling details. {connected ? 'Only an isolated Xano draft is submitted.' : 'No real booking is submitted.'}</p></div><button className="btn primary" disabled={busy} onClick={()=>navigate('draft')}><Plus size={17}/> Create draft</button></div></Card></>}

        {active && screen === 'draft' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,.7fr)]">
          <Card><form aria-label="Create synthetic draft booking" className="space-y-6 p-5 sm:p-7" onSubmit={saveDraft}><div><h2 className="text-lg font-bold">Route and schedule</h2><p className="mt-1 text-xs text-muted">{connected ? 'Submitted through the protected gateway with an idempotent request ID.' : 'All entries stay in memory in this browser tab.'}</p></div><div className="grid gap-5 sm:grid-cols-2">
            {field('Pickup city','pickupCity')}{field('Delivery city','deliveryCity')}{field('Pickup street','pickupStreet')}{field('Delivery street','deliveryStreet')}{field('Pickup window starts','pickupStart','datetime-local')}{field('Pickup window ends','pickupEnd','datetime-local')}{field('Delivery window starts','deliveryStart','datetime-local')}{field('Delivery window ends','deliveryEnd','datetime-local')}
          </div><div className="flex flex-wrap gap-3"><button type="submit" className="btn primary" disabled={busy}>Save synthetic draft</button><button type="button" className="btn" disabled={busy} onClick={()=>navigate('home')}>Back to overview</button></div></form></Card>
          <Card><div className="space-y-4 p-5"><MapPin size={22} className="text-brand"/><h2 className="font-bold">Draft only</h2><Notice>Real route lookup, freight pricing, consent, payment and dispatch are disabled.</Notice><button className="btn w-full" disabled>Quote unavailable</button><button className="btn w-full" disabled>Pay unavailable</button><button className="btn w-full" disabled>Dispatch unavailable</button></div></Card>
        </div>}

        {active && screen === 'orders' && <Card><div className="card-head"><div><h2 className="card-title">Synthetic drafts</h2><p className="mt-1 text-xs text-muted">{connected ? 'Retrieved from your authenticated Xano organization.' : 'Stored only while this test session remains active.'}</p></div><button className="btn primary" disabled={busy} onClick={()=>navigate('draft')}><Plus size={15}/> New draft</button></div>
          {drafts.length ? <ul className="divide-y divide-line">{drafts.map(d => <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-bold">{d.reference}</p><p className="mt-1 text-xs text-muted">{d.pickupCity} → {d.deliveryCity}</p><div className="mt-2"><Badge tone="neutral">Draft</Badge></div></div><button className="btn" disabled={busy} aria-label={'View draft '+d.reference} onClick={()=>void detail(d)}>View details <ArrowRight size={16}/></button></li>)}</ul> : <div className="px-6 py-12 text-center text-sm text-muted">No drafts yet. Create your first synthetic draft.</div>}
        </Card>}

        {active && screen === 'detail' && selected && <Card><div className="space-y-5 p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">{selected.reference}</h2><Badge tone="neutral">Draft</Badge></div><dl className="grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-muted">Pickup</dt><dd className="font-semibold">{selected.pickupCity}, {selected.pickupStreet}</dd></div><div><dt className="text-muted">Delivery</dt><dd className="font-semibold">{selected.deliveryCity}, {selected.deliveryStreet}</dd></div><div><dt className="text-muted">Booking state</dt><dd className="font-semibold">Draft · version {selected.version}</dd></div><div><dt className="text-muted">Payment</dt><dd className="font-semibold">Pending · not collected</dd></div></dl><Notice>No confirmed booking, payment, vehicle assignment or POD exists.</Notice><div className="flex flex-wrap gap-2"><button className="btn" onClick={()=>navigate('orders')}>Back to my drafts</button><button className="btn" disabled>Confirm unavailable</button></div></div></Card>}
        <footer className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-muted">Zippy Logistics · Synthetic customer preview. {connected ? 'Isolated sandbox records only.' : 'No real records.'} No provider calls or operational actions.</footer>
      </div>
    </div>
  </main>;
}
