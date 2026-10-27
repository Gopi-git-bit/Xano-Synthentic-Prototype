import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowRight, Bell, Box, Check, ChevronRight, CircleHelp, ClipboardCheck, LayoutDashboard, MapPin, Menu, MessageSquare, Plus, Send, ShieldCheck, Truck, Users, Wallet, X, type LucideIcon } from 'lucide-react';
import { Badge, Card, DetailRows, Dialog, EmptyState, Notice, PageIntro, RouteMap, Timeline, TruckArt } from '../components';
import { money, type Booking, type Order, type Role } from '../types';
import { emptyBooking, fleet, identities, initialOrders, milestones, navs, tamil } from './data';
import BookingFlow from './BookingFlow';
import { OrderDetail, OrderList } from './Orders';
import { AgentResponsibilities, ConnectionStatus, Documents, Fleet, Incidents, Participants, Payments, Profile, Reviews, Support } from './Workspaces';
import { scenarios, scopedOwnerOrders, type Scenario } from './permissions';
import Jobs from './Jobs';
import CRM from '../CRM';

const roles: Role[] = ['customer', 'owner', 'admin'];
const roleNames: Record<Role, string> = { customer: 'Customer', owner: 'Vehicle Owner', admin: 'Admin' };
const icons: Record<string, LucideIcon> = { Home: LayoutDashboard, Book: Plus, Orders: Box, Jobs: Truck, Vehicles: Truck, Earnings: Wallet, 'All Orders': Box, 'Fleet Visibility': MapPin, Payments: Wallet, Support: CircleHelp, Profile: Users, Incidents: ShieldCheck, Participants: Users, 'Reviews & Holds': ClipboardCheck, Announcements: Send, CRM: MessageSquare, 'Agent Responsibilities': Activity };
const initialRole = () => { const value = new URLSearchParams(location.search).get('preview'); return roles.includes(value as Role) ? value as Role : 'customer'; };
const hashPage = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } };
const initialScenario = (): Scenario => { const value = new URLSearchParams(location.search).get('scenario'); return value && Object.hasOwn(scenarios, value) ? value as Scenario : 'ownerDriver'; };

export default function App() {
  const [role, setRole] = useState<Role>(initialRole);
  const [page, setPage] = useState(() => navs[initialRole()].includes(hashPage()) ? hashPage() : 'Home');
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [mobile, setMobile] = useState(false);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [booking, setBooking] = useState<Booking>({ ...emptyBooking });
  const [online, setOnline] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [detail, setDetail] = useState<Order | null>(null);
  const [info, setInfo] = useState<'notifications' | 'help' | null>(null);
  const [tracking, setTracking] = useState(false);
  const [drivers, setDrivers] = useState(false);
  const [message, setMessage] = useState('');
  const main = useRef<HTMLElement>(null);
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const identity = identities[role];
  const grant = scenarios[scenario];
  const financial = role !== 'owner' || grant.finance;
  const scopedOrders = role === 'owner' ? scopedOwnerOrders(orders, scenario) : orders;
  const scopedFleet = fleet.filter(v => grant.vehicles.includes(v.plate));
  const ordersPage = role === 'customer' ? 'Orders' : role === 'owner' ? 'Jobs' : 'All Orders';
  const copy = (label: string) => language === 'ta' ? tamil[label] || label : label;
  useEffect(() => {
    const onHash = () => { const next = hashPage(); setPage(navs[role].includes(next) ? next : 'Home'); setDetail(null); };
    window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash);
  }, [role]);
  useEffect(() => { document.title = `${page} · Zippy ${roleNames[role]}`; main.current?.focus({ preventScroll: true }); }, [page, role]);
  useEffect(() => {
    if (!mobile) return;
    const dialog = mobileDialog.current!; const trigger = menuTrigger.current; dialog.showModal(); const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = before; trigger?.focus({ preventScroll: true }); };
  }, [mobile]);
  function go(next: string) {
    if (!navs[role].includes(next)) return;
    setPage(next); location.hash = encodeURIComponent(next); setMobile(false); setDetail(null); setMessage(''); setInfo(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function changeRole(next: Role) {
    setRole(next); setPage('Home'); setDetail(null); setTracking(false); setInfo(null); setMobile(false); setMessage(''); setDrivers(false);
    history.replaceState(null, '', `?demo=1&preview=${next}#Home`);
  }
  function saveBooking() {
    const draft: Order = { id: `DRAFT-${orders.filter(o => o.status === 'Draft').length + 1}`, from: booking.from, to: booking.to, vehicle: booking.vehicle, date: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date()), status: 'Draft', payment: 'Not initiated', amount: null, paid: 0, cargo: booking.cargo, weight: booking.weight, driver: 'Not assigned', plate: '—', settlement: 'Not eligible', refund: 'Not requested', consent: 'Not requested', pod: 'Not submitted' };
    setOrders([draft, ...orders]); go('Orders'); setBooking({ ...emptyBooking }); setMessage('Preview draft saved. Booking confirmation is pending a verified quote and server acceptance. No payment or assignment was created.');
  }
  const bookButton = <button className="btn primary" onClick={() => go('Book')}><Plus size={17}/>{language === 'ta' ? 'வாகனம் பதிவு செய்' : 'Book a vehicle'}</button>;
  const availability = <button className={`btn ${online ? 'soft' : ''}`} onClick={() => setOnline(!online)} aria-pressed={online} aria-label="Available for new work"><span className={`flex h-5 w-9 items-center rounded-full p-0.5 ${online ? 'bg-brand' : 'bg-muted'}`}><span className={`size-4 rounded-full bg-white transition-transform duration-200 ${online ? 'translate-x-4' : ''}`}/></span>{online ? 'Online for offers' : 'Offline for offers'}</button>;
  function navigation() {
    return <div className="flex min-h-full flex-col px-5 pt-8 pb-5"><div className="brand px-3 text-white"><span className="brand-mark">z</span><span className="font-display text-[32px] leading-none font-extrabold">zippy<span className="mt-2 block text-[9px] tracking-[.36em] text-[#c2cfc7]">LOGISTICS</span></span></div><p className="mt-10 mb-3 px-3 text-[10px] font-semibold tracking-[.18em] text-[#b5c4ba]">{roleNames[role].toUpperCase()}</p><nav aria-label="Main navigation" className="space-y-1">{navs[role].map(n => { const Icon = icons[n]; return <button key={n} className="sidebar-link" onClick={() => go(n)} aria-current={page === n ? 'page' : undefined} aria-label={n}><Icon size={18}/><span lang={language === 'ta' && tamil[n] ? 'ta' : 'en'} className="min-w-0 leading-relaxed">{copy(n)}</span></button>; })}</nav><div className="mt-auto pt-8"><div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white"><MessageSquare size={20}/><h2 className="mt-3 text-xs font-bold">Here for the whole journey.</h2><p className="mt-2 text-[11px] text-[#c0cec5]">A clear answer for every mile.</p><button className="mt-2 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#ffcfb4]" onClick={() => { setMobile(false); setInfo('help'); }}>Support <ArrowRight size={14}/></button></div><div className="mt-5 border-t border-white/10 pt-5 text-white"><p className="text-xs font-semibold">{identity.name}</p><p className="mt-1 text-[10px] text-[#c0cec5]">{role === 'owner' ? grant.label : identity.account}</p></div></div></div>;
  }
  function home() {
    const active = scopedOrders.filter(o => ['Confirmed', 'In transit'].includes(o.status)).length;
    const balance = scopedOrders.filter(o => o.status !== 'Cancelled').reduce((n, o) => n + Math.max(0, (o.amount || 0) - o.paid), 0);
    const stats: [string, string, LucideIcon][] = [['Active orders', String(active).padStart(2, '0'), Box], [role === 'owner' ? 'Assigned vehicles' : 'In transit', String(role === 'owner' ? scopedFleet.length : scopedOrders.filter(o => o.status === 'In transit').length).padStart(2, '0'), Truck], ['Delivered', String(scopedOrders.filter(o => o.status === 'Delivered').length).padStart(2, '0'), Check], [role === 'owner' ? 'Earnings ledger' : 'Outstanding', role === 'owner' ? grant.finance ? 'Pending' : 'Restricted' : money(balance), Wallet]];
    return <><PageIntro title={role === 'customer' ? language === 'ta' ? 'வணக்கம், கோபி.' : 'A good day to move forward, Gopi.' : role === 'owner' ? 'Your next mile starts here.' : 'Your operations, in focus.'} subtitle="Every journey, every handover, one clear view.">{role === 'customer' ? bookButton : role === 'owner' ? availability : <button className="btn primary" onClick={() => go('Reviews & Holds')}><ShieldCheck size={17}/> Review queue</button>}</PageIntro>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-line bg-brand-soft p-6 sm:p-8"><div className="relative z-10 max-w-[80%] sm:max-w-[62%]"><p className="eyebrow">LESS COORDINATION. MORE MOMENTUM.</p><h2 className="text-[25px] leading-tight font-extrabold tracking-tight sm:text-[29px]">{role === 'admin' ? <>A clearer picture.<br/>A considered next step.</> : role === 'owner' ? <>One workspace.<br/>Every role on the road.</> : <>Your next delivery.<br/>Our next priority.</>}</h2><p className="mt-3 max-w-sm text-xs leading-relaxed text-muted">{role === 'owner' ? 'Your assigned work and authorized actions, from pickup to final handover.' : 'Simple bookings. Clear updates. The right details at every step.'}</p><button className="text-btn mt-3" onClick={() => go(role === 'customer' ? 'Book' : role === 'owner' ? 'Jobs' : 'Reviews & Holds')}>Find your next step <ArrowRight size={16}/></button></div><div className="pointer-events-none absolute right-[-70px] bottom-0 h-[220px] w-[400px] text-brand opacity-20 sm:right-0 sm:opacity-85"><TruckArt/></div></section>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value, Icon]) => <div className="card stat-card" key={label}><div className="flex items-start justify-between gap-2"><h2 className="text-[11px] text-muted">{label}</h2><Icon size={18} className="text-brand"/></div><p className="mt-4 text-[25px] font-bold tabular-nums">{value}</p><p className="mt-2 text-[10px] text-muted">Sample records · preview</p></div>)}</div>
      {role === 'owner' && <ConnectionStatus online={online}/>}
      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,1fr)]"><RouteMap zoom={zoom} setZoom={setZoom}/><Timeline items={milestones} action={() => { const order = scopedOrders.find(o => o.id === 'ZP-2048'); if (order) setDetail(order); }}/></div>
      <OrderList orders={scopedOrders} financial={financial} onDetail={setDetail} compact onViewAll={() => go(ordersPage)}/>
      <div className="mt-6 grid gap-5 sm:grid-cols-2"><Card title="The right details. No guesswork."><div className="px-5 pb-5"><p className="text-xs text-muted">Collections, consent, evidence and settlements each have their own status.</p><button className="text-btn mt-3" onClick={() => go(role === 'owner' ? 'Earnings' : 'Payments')}>View details <ArrowRight size={15}/></button></div></Card><Card title="A little help along the way?"><div className="px-5 pb-5"><p className="text-xs text-muted">Prepare a support request or review your contact details.</p><button className="text-btn mt-3" onClick={() => setInfo('help')}>Contact support <ArrowRight size={15}/></button></div></Card></div>
    </>;
  }
  let content: ReactNode;
  if (page === 'Home') content = home();
  else if (page === 'Book') content = <BookingFlow booking={booking} setBooking={setBooking} onSave={saveBooking} onCancel={() => go('Home')}/>;
  else if (page === 'Orders' || page === 'All Orders') content = <><PageIntro title="Every order. One clear view." subtitle="Search, filter and follow each shipment.">{role === 'customer' ? bookButton : null}</PageIntro><OrderList orders={scopedOrders} onDetail={setDetail}/><div className="mt-5"><Documents orders={scopedOrders} role={role}/></div></>;
  else if (page === 'Jobs') content = <><div className="mb-5">{availability}</div><ConnectionStatus online={online}/><Jobs orders={scopedOrders} scenario={scenario} online={online} onDetail={setDetail}/></>;
  else if (page === 'Vehicles') content = <>{grant.manage && <div className="mb-5 flex gap-3"><button className="btn" aria-pressed={!drivers} onClick={() => setDrivers(false)}>Vehicles</button><button className="btn" aria-pressed={drivers} onClick={() => setDrivers(true)}>Assigned drivers</button></div>}<Fleet key={String(drivers)} records={scopedFleet} canManage={grant.manage} driversOnly={drivers && grant.manage}/></>;
  else if (page === 'Payments' || page === 'Earnings') content = financial ? <><Payments orders={scopedOrders} role={role} onDetail={setDetail}/>{role === 'owner' && <div className="mt-5"><Card title="Settlement holds & resolution">{scopedOrders.filter(o => o.settlement === 'On hold').map(o => <div className="data-row" key={o.id}><h3 className="font-bold">{o.id} · POD correction required</h3><p>Required: clear recipient signature. Affected action: settlement release. Owner: Operations / Finance. Release: authorized evidence verification and reconciliation.</p></div>)}<p className="px-5 py-4 text-xs text-muted">Evidence submission remains available. Payout amounts, commission and deductions require an authorized ledger.</p></Card></div>}</> : <><PageIntro title="Earnings access is restricted." subtitle="Your salaried-driver assignment includes trip execution only."/><Card><EmptyState title="Financial permission required">No commercial rates, collections, balances or settlement amounts are included in this view. Contact your fleet owner for authorized payroll information.</EmptyState></Card></>;
  else if (page === 'Profile') content = <><Profile role={role}/><div className="mt-5"><Support role={role}/></div></>;
  else if (page === 'Reviews & Holds') content = <Reviews/>;
  else if (page === 'Fleet Visibility') content = <><PageIntro title="A clearer view of the journey." subtitle="Illustrative route; last location update unavailable. Tracking is stale/offline."/><RouteMap zoom={zoom} setZoom={setZoom}/></>;
  else if (page === 'Participants') content = <Participants/>;
  else if (page === 'Incidents') content = <Incidents role={role}/>;
  else if (page === 'CRM') content = <CRM preview/>;
  else if (page === 'Support' || page === 'Announcements') content = <Support role={role} announcement={page === 'Announcements'}/>;
  else content = <AgentResponsibilities/>;

  return <div data-role={role} className="app-content min-h-dvh bg-canvas text-ink"><a href="#main" className="skip" onClick={e => { e.preventDefault(); main.current?.focus(); }}>Skip to content</a><aside className="sidebar-scroll fixed inset-y-0 left-0 z-30 hidden w-[238px] overflow-y-auto bg-nav lg:block">{navigation()}</aside><div className="lg:ml-[238px]">
    <header className="border-b border-line bg-surface/85"><div className="mx-auto flex min-h-[78px] max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8"><div className="flex min-w-0 items-center gap-2 text-xs"><button ref={menuTrigger} className="icon-btn lg:hidden" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={21}/></button><span className="text-muted">{roleNames[role]}</span><ChevronRight size={14}/><span>{copy(page)}</span></div><div className="flex items-center gap-2"><Badge>Local preview</Badge><button className="icon-btn" aria-label="Notifications" onClick={() => setInfo('notifications')}><Bell size={18}/></button><span className="grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{identity.initials}</span></div></div></header>
    <div className="border-b border-line bg-surface/50"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8"><p className="text-[11px] leading-relaxed text-muted"><strong>Design preview.</strong> Sample data · local drafts · no live permissions.</p><div className="flex w-full flex-wrap gap-2 sm:w-auto"><label className="field flex-1 text-[11px] sm:flex-none">Preview workspace<select aria-label="Preview workspace" value={role} onChange={e => changeRole(e.target.value as Role)}>{roles.map(r => <option value={r} key={r}>{roleNames[r]}</option>)}</select></label>{role === 'owner' && <label className="field flex-1 text-[11px] sm:flex-none">Permission scenario<select value={scenario} onChange={e => { setScenario(e.target.value as Scenario); setDetail(null); setDrivers(false); setInfo(null); setTracking(false); }}>{Object.entries(scenarios).map(([id, value]) => <option key={id} value={id}>{value.label}</option>)}</select></label>}<label className="field text-[11px]">Navigation language<select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'ta')}><option value="en">EN</option><option value="ta">தமிழ்</option></select></label></div></div></div>
    <main ref={main} id="main" tabIndex={-1} className="mx-auto min-h-[75dvh] max-w-[1600px] px-4 pt-7 pb-5 sm:px-8 xl:px-10">{message && <div role="status" className="notice mb-6">{message}</div>}<div className="fade-in" key={`${role}-${page}-${scenario}`}>{content}</div></main><footer className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[11px] text-muted sm:px-8"><span>© 2026 Zippy Logistics · Made for the road ahead.</span><button className="text-btn" onClick={() => setInfo('help')}>Help & support</button></footer>
  </div>{mobile && <dialog ref={mobileDialog} aria-label="Navigation drawer" className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(290px,90vw)] max-w-none border-0 bg-nav p-0 shadow-2xl" onCancel={e => { e.preventDefault(); setMobile(false); }}><button className="absolute top-2 right-2 grid size-11 place-items-center rounded-lg text-white" aria-label="Close navigation" onClick={() => setMobile(false)}><X size={20}/></button>{navigation()}</dialog>}
    {detail && <Dialog title={`Order ${detail.id}`} onClose={() => setDetail(null)}><OrderDetail order={detail} financial={financial} onCancelDraft={() => { setOrders(orders.filter(o => o.id !== detail.id)); setDetail(null); setMessage('Local booking draft discarded.'); }} onTrack={() => { setDetail(null); setTracking(true); }}/></Dialog>}
    {tracking && <Dialog title="Shipment tracking" onClose={() => setTracking(false)}><RouteMap zoom={zoom} setZoom={setZoom}/><DetailRows rows={[["Last location update", 'Unavailable'], ['Tracking signal', 'Stale / offline'], ['ETA', 'Illustrative only; not a live prediction']]}/><Notice>Live navigation requires a verified location source. No GPS updates are simulated.</Notice></Dialog>}
    {info && <Dialog title={info === 'help' ? 'Here for the whole journey.' : 'Your latest updates'} onClose={() => setInfo(null)}>{info === 'help' ? <Support role={role}/> : <><Badge>Sample notifications</Badge><DetailRows rows={scopedOrders.slice(0, 3).map(o => [o.id, o.status])}/><Notice>Notification delivery is not connected.</Notice></>}</Dialog>}
  </div>;
}
