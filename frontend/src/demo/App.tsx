import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowRight, Bell, Box, Check, ChevronRight, CircleHelp, ClipboardCheck, LayoutDashboard, MapPin, Menu, MessageSquare, Plus, Send, ShieldCheck, Truck, Users, Wallet, X, type LucideIcon } from 'lucide-react';
import { Badge, Card, DetailRows, Dialog, EmptyState, Notice, PageIntro, RouteMap, Timeline, TruckArt } from '../components';
import { money, type Booking, type Order, type Role } from '../types';
import { emptyBooking, fleet, identities, initialOrders, milestones, navs, tamil } from './data';
import BookingFlow from './BookingFlow';
import { OrderDetail, OrderList } from './Orders';
import { AgentAssessments as AgentAssessmentsView } from './AgentAssessments';
import { AgentResponsibilities, ConnectionStatus, Documents, Fleet as FleetView, Incidents, Participants, Payments, Profile, Reviews, Support } from './Workspaces';
import { scenarios, scopedOwnerOrders, type Scenario } from './permissions';
import Jobs from './Jobs';
import CRM from '../CRM';

const roles: Role[] = ['customer', 'owner', 'admin'];
const roleNames: Record<Role, string> = { customer: 'Customer', owner: 'Vehicle Owner', admin: 'Admin' };
const icons: Record<string, LucideIcon> = { Home: LayoutDashboard, Book: Plus, Orders: Box, Jobs: Truck, Vehicles: Truck, Earnings: Wallet, 'All Orders': Box, 'Fleet Visibility': MapPin, Payments: Wallet, 'Reviews & Holds': ShieldCheck, Incidents: Activity, Support: MessageSquare, Announcements: Bell, CRM: ClipboardCheck, 'Agent Responsibilities': Users, 'Agent Assessments': ClipboardCheck };
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
    const draft: Order = { id: `DRAFT-${orders.filter(o => o.status === 'Draft').length + 1}`, from: booking.from, to: booking.to, vehicle: booking.vehicle, date: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year:'numeric' }).format(new Date()), status: 'Draft', payment: 'Not initiated', amount: null, paid: 0, cargo: booking.cargo, weight: booking.weight, driver: 'Unassigned', plate: 'Pending', settlement: 'Not initiated', refund: 'Not applicable' };
    setOrders([draft, ...orders]); go('Orders'); setBooking({ ...emptyBooking }); setMessage('Preview draft saved. Booking confirmation is pending a verified quote and server acceptance. No payment or assignment is executed.');
  }
  const bookButton = <button className="btn primary" onClick={() => go('Book')}><Plus size={17}/>{language === 'ta' ? 'வாகனம் பதிவு செய்' : 'Book a vehicle'}</button>;
  const availability = <button className={`btn ${online ? 'soft' : ''}`} onClick={() => setOnline(!online)} aria-pressed={online} aria-label="Available for new work"><span className={`flex h-5 w-9 items-center rounded-full ${online ? 'bg-brand-soft' : 'bg-line'} p-0.5`}><span className={`block h-4 w-4 rounded-full transition ${online ? 'translate-x-4 bg-brand' : 'bg-muted'}`} /></span>{online ? 'Available for new work' : 'Offline for new work'}</button>;
  function navigation() {
    return <div className="flex min-h-full flex-col px-5 pt-8 pb-5"><div className="brand px-3 text-white"><span className="brand-mark">z</span><span className="font-display text-[32px] leading-none">Zippy</span></div><div className="mt-5 grid gap-2">{navs[role].map(label => <button key={label} type="button" className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => go(label)}>{(() => { const Icon = icons[label] ?? Box; return <Icon size={16} />; })()}<span>{copy(label)}</span></button>)}</div><div className="mt-6 rounded-2xl border border-line bg-surface p-3 text-xs leading-relaxed text-muted">Demo mode is explicit. This preview never updates backend capabilities or live auth state.</div></div>;
  }
  function home() {
    const active = scopedOrders.filter(o => ['Confirmed', 'In transit'].includes(o.status)).length;
    const balance = scopedOrders.filter(o => o.status !== 'Cancelled').reduce((n, o) => n + Math.max(0, (o.amount || 0) - o.paid), 0);
    const stats: [string, string, LucideIcon][] = [['Active orders', String(active).padStart(2, '0'), Box], [role === 'owner' ? 'Assigned vehicles' : 'In transit', String(role === 'owner' ? scopedFleet.length : active).padStart(2, '0'), Truck], ['Open holds', String(scopedOrders.filter(o => o.payment === 'Unknown — reconcile').length).padStart(2, '0'), ShieldCheck], ['Exposure', money(balance), Wallet]];
    return <><PageIntro title={role === 'customer' ? language === 'ta' ? 'வணக்கம், கோபி.' : 'A good day to move forward, Gopi.' : role === 'owner' ? 'Your next mile starts here.' : 'Operations overview'} subtitle="Review the order cycle, evidence, and human decisions in the explicit demo-only assessment view." eyebrow={role === 'customer' ? 'CUSTOMER VIEW' : role === 'owner' ? 'OWNER VIEW' : 'ADMIN VIEW'}>{role === 'customer' && bookButton}</PageIntro><section className="relative mb-6 overflow-hidden rounded-2xl border border-line bg-brand-soft p-6 sm:p-8"><div className="relative z-10 max-w-[80%] sm:max-w-[62%]"><p className="eyebrow">DEMO STATUS</p><h2 className="mt-3 text-2xl font-bold text-ink">Synthetic review only. Live backend route checks remain disabled.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">No Xano integration, provider trigger or payment action is available from this preview.</p></div></section><div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value, Icon]) => <div className="card stat-card" key={label}><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[.16em] text-muted">{label}</p><p className="mt-3 text-2xl font-bold text-ink">{value}</p></div><Icon size={18} className="text-brand"/></div></div>)}</div>{role === 'owner' && <ConnectionStatus online={online}/>}<div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,1fr)]"><RouteMap zoom={zoom} setZoom={setZoom}/><Timeline items={milestones} action={() => setTracking(true)} /></div><OrderList orders={scopedOrders} financial={financial} onDetail={setDetail} compact onViewAll={() => go(ordersPage)}/><div className="mt-6 grid gap-5 sm:grid-cols-2"><Card title="The right details. No guesswork."><div className="px-5 pb-5"><p className="text-xs text-muted">Collections, consent, evidence and review state stay distinct from execution. </p></div></Card><Card title="Demo evidence"><div className="px-5 pb-5"><p className="text-xs text-muted">Assessment recommendations never unlock live actions, even when confidence is high.</p></div></Card></div></>;
  }
  let content: ReactNode;
  if (page === 'Home') content = home();
  else if (page === 'Book') content = <BookingFlow booking={booking} setBooking={setBooking} onSave={saveBooking} onCancel={() => go('Home')} />;
  else if (page === 'Orders' || page === 'All Orders') content = <><PageIntro title="Every order. One clear view." subtitle="Search, filter and follow each shipment.">{role === 'customer' ? bookButton : <button className="btn" onClick={() => setMessage('Preview-only order review. No operational action is executed.')}>Review as demo</button>}</PageIntro><OrderList orders={scopedOrders} financial={financial} onDetail={setDetail} compact={false} onViewAll={() => go(ordersPage)} /><div className="mt-5"><Card title="Demo note"><p className="px-5 pb-5 text-xs text-muted">Orders remain read-only in the demo; backend execution stays gated.</p></Card></div></>;
  else if (page === 'Jobs') content = <><div className="mb-5">{availability}</div><ConnectionStatus online={online}/><Jobs orders={scopedOrders} scenario={scenario} online={online} onDetail={setDetail} /></>;
  else if (page === 'Vehicles') content = <>{grant.manage && <div className="mb-5 flex gap-3"><button className="btn" aria-pressed={!drivers} onClick={() => setDrivers(false)}>Vehicles</button><button className="btn soft" aria-pressed={drivers} onClick={() => setDrivers(true)}>Drivers</button></div>}<FleetView driversOnly={drivers} records={scopedFleet} canManage={grant.manage} /></>;
  else if (page === 'Payments' || page === 'Earnings') content = financial ? <><Payments orders={scopedOrders} role={role} onDetail={setDetail} />{role === 'owner' && <div className="mt-5"><Card title="Demo settlement note"><p className="px-5 pb-5 text-xs text-muted">Settlement controls remain disabled while the backend verification is pending.</p></Card></div>}</> : <EmptyState title="Financial permission required"><p>Demo-only permissions remain restricted until the backend contract is verified.</p></EmptyState>;
  else if (page === 'Profile') content = <><Profile role={role}/><div className="mt-5"><Support role={role}/></div></>;
  else if (page === 'Reviews & Holds') content = <Reviews />;
  else if (page === 'Fleet Visibility') content = <><PageIntro title="A clearer view of the journey." subtitle="Illustrative route; last location update unavailable. Tracking is stale/offline."/><div className="mt-5"><Card title="Fleet tracking preview"><p className="px-5 pb-5 text-xs text-muted">Tracking remains illustrative and does not imply live vehicle state or dispatch action.</p></Card></div></>;
  else if (page === 'Participants') content = <Participants />;
  else if (page === 'Incidents') content = <Incidents role={role}/>;
  else if (page === 'CRM') content = <CRM preview/>;
  else if (page === 'Support' || page === 'Announcements') content = <Support role={role} announcement={page === 'Announcements'} />;
  else if (page === 'Agent Assessments' || page === 'Agent Responsibilities') content = <AgentAssessmentsView />;
  else content = <AgentResponsibilities />;

  return <div data-role={role} className="app-content min-h-dvh bg-canvas text-ink"><a href="#main" className="skip" onClick={e => { e.preventDefault(); main.current?.focus(); }}>Skip to content</a><header className="border-b border-line bg-surface/85"><div className="mx-auto flex min-h-[78px] max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8"><div className="flex items-center gap-3"><button type="button" ref={menuTrigger} className="btn soft md:hidden" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={17} /></button><div className="brand px-3 text-white"><span className="brand-mark">z</span><span className="font-display text-[32px] leading-none">Zippy</span></div></div><div className="flex items-center gap-2"><label className="field inline-flex min-w-[0] border-none bg-transparent p-0"><span className="sr-only">Language</span><select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'ta')} className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-xs"><option value="en">EN</option><option value="ta">TA</option></select></label><label className="field inline-flex min-w-[0] border-none bg-transparent p-0"><span className="sr-only">Role</span><select value={role} onChange={e => changeRole(e.target.value as Role)} className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-xs"><option value="customer">Customer</option><option value="owner">Vehicle owner</option><option value="admin">Admin</option></select></label></div></div><div className="border-b border-line bg-surface/50"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8"><p className="text-[11px] uppercase tracking-[.18em] text-muted">{roleNames[role]} workspace</p><div className="flex items-center gap-2 text-xs text-muted"><span>{identity.name}</span><span>•</span><span>{identity.account}</span></div></div></div></header><main ref={main} id="main" tabIndex={-1} className="mx-auto min-h-[75dvh] max-w-[1600px] px-4 pt-7 pb-5 sm:px-8 xl:px-10">{message && <div role="status" className="notice mb-6">{message}</div>}{content}</main>{mobile && <dialog ref={mobileDialog} aria-label="Navigation drawer" className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(290px,90vw)] max-w-none border-0 bg-nav p-0 shadow-2xl" onClick={e => { if (e.target === mobileDialog.current) setMobile(false); }}><div className="h-full overflow-y-auto">{navigation()}</div></dialog>}</div>;
}
