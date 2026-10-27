import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, Check, Clock3, FileQuestion, MapPin, Minus, Plus, Truck, X } from 'lucide-react';
import type { Tone } from './types';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`status status-${tone}`}>{children}</span>;
}
export function Notice({ children }: { children: ReactNode }) { return <div className="notice">{children}</div>; }
export function Card({ title, subtitle, action, children, className = '' }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{title && <div className="card-head"><div><h2 className="card-title">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>}</div>{action}</div>}{children}</section>;
}
export function PageIntro({ title, subtitle, eyebrow = 'YOUR FREIGHT, SIMPLIFIED', children }: { title: string; subtitle: string; eyebrow?: string; children?: ReactNode }) {
  return <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><p className="eyebrow">{eyebrow}</p><h1 className="text-[27px] leading-snug font-extrabold tracking-[-.045em] sm:text-[31px]">{title}</h1><p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{subtitle}</p></div><div className="shrink-0">{children}</div></div>;
}
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="flex flex-col items-center px-5 py-10 text-center"><div className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><FileQuestion size={24} /></div><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 max-w-md text-xs leading-relaxed text-muted">{children}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef(document.activeElement as HTMLElement | null);
  const id = useId();
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const returnFocus = trigger.current;
    dialog.showModal();
    return () => { dialog.close(); if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="modal card p-0 shadow-2xl" aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}><div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4"><h2 id={id} className="text-lg font-bold">{title}</h2><button className="icon-btn" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div><div className="space-y-5 p-5 sm:p-6">{children}</div></dialog>;
}
export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return <dl className="divide-y divide-line">{rows.map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-5 gap-y-1 py-3 text-[13px]"><dt className="text-muted">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <span className="text-xs leading-relaxed font-normal text-muted">{hint}</span>}</label>;
}

// Truck illustration adapted from the approved public frontend; no stock images or claims.
export function TruckArt() {
  return <svg className="hero-art h-full w-full" viewBox="0 0 400 200" fill="none" aria-hidden="true"><circle cx="290" cy="96" r="145" fill="currentColor" opacity=".06"/><circle cx="290" cy="96" r="112" stroke="currentColor" opacity=".13" strokeDasharray="4 7"/><path d="M60 168h340M210 0v200" stroke="currentColor" opacity=".1"/><path d="m50 186 21-15h290l32 15" fill="currentColor" opacity=".1"/><g transform="translate(91 66)"><path d="m3 17 27-15h149v80H3Z" fill="#f9faf4" stroke="#a7b69e"/><path d="m3 17 27-15v67L3 82Z" fill="#b6c5aa"/><path d="M39 20h128M39 29h128M39 38h128M39 47h128M39 56h128M39 65h128" stroke="#dae0d1" strokeWidth="2"/><path d="M179 34h34l25 29v22h-59Z" fill="var(--z-brand)"/><path d="M187 42h22l15 19h-37Z" fill="#29453f"/><path d="M6 82h237v9H6Z" fill="#475747"/>{[44,161,208].map(x=><g key={x}><circle cx={x} cy="88" r="15" fill="#31433c"/><circle cx={x} cy="88" r="7" fill="#b2bba9"/></g>)}<text x="81" y="51" fontFamily="Arial" fontStyle="italic" fontWeight="bold" fontSize="24" fill="#788d6b">zippy</text></g><path d="M340 38v22M330 48h20" stroke="currentColor" opacity=".4"/></svg>;
}

export function RouteMap({ zoom = 1, setZoom, title = 'Your shipment, on the move', from = 'Chennai', to = 'Bengaluru' }: { zoom?: number; setZoom?: (zoom: number) => void; title?: string; from?: string; to?: string }) {
  const pattern = useId();
  return <Card title={title} subtitle={`ZP-2048 · ${from} → ${to}`} action={<Badge tone="warning">In transit</Badge>}>
    <div className="map-surface relative overflow-hidden">
      <svg className="h-[245px] w-full sm:h-[270px]" viewBox="0 0 640 275" role="img" aria-label={`Illustrative route from ${from} to ${to}. Not live tracking.`}>
        <defs><pattern id={pattern} width="72" height="60" patternUnits="userSpaceOnUse"><path d="M0 30h72M36 0v60" stroke="#e1e6d7" strokeWidth=".8"/></pattern></defs>
        <rect width="640" height="275" fill={`url(#${pattern})`}/>
        <g transform={`translate(${320 * (1 - zoom)} ${137 * (1 - zoom)}) scale(${zoom})`}>
          <path d="M580 0h60v275H550l9-60 24-39-11-41 26-41Z" fill="#d9e8e6"/><path d="M0 0h130l40 45-70 40L0 60ZM0 200l110-20 40 95H0ZM260 0h105l50 44-100 30ZM300 215l99-31 60 91H277Z" fill="#e0e7d5"/>
          <path className="map-road" d="M-20 121 82 106l103 32 97-36 98 11 91-34 135 18M83-20l24 83 35 70-11 73 33 90M280-20l-10 76 35 72 12 147M443-20l-22 77 52 47-4 89 64 99M-20 213l121-18 83 27 117-48 120 24 159-40"/>
          <path d="m125 104 48 29 58-9 47-20 55 9 36-1 56-26 47-3 45 26" fill="none" stroke="#79916a" strokeWidth="4"/>
          <path d="m125 104 48 29 58-9 47-20 55 9" fill="none" stroke="var(--z-brand)" strokeWidth="4" strokeDasharray="6 4"/>
          <g className="map-label"><text x="75" y="82" fontWeight="bold">{to}</text><text x="490" y="141" fontWeight="bold">{from}</text><text x="182" y="168">Krishnagiri</text><text x="353" y="152">Vellore</text><text x="410" y="63">Kanchipuram</text><text x="205" y="234">Tiruvannamalai</text></g>
          <circle cx="125" cy="104" r="6" fill="#fff" stroke="#66805b" strokeWidth="3"/><circle cx="517" cy="109" r="6" fill="#fff" stroke="#66805b" strokeWidth="3"/>
          <circle cx="333" cy="113" r="24" fill="var(--z-brand)" opacity=".12"/><rect x="317" y="97" width="32" height="32" rx="9" fill="var(--z-brand)" stroke="white" strokeWidth="3"/>
          <path d="M324 106h10v10h-10zM334 110h4l4 4v2h-8M327 118h1M337 118h1" stroke="white" strokeWidth="1.5" fill="none"/>
        </g>
      </svg>
      <span className="absolute top-3 left-3 rounded-md bg-white/95 px-2 py-1.5 text-[9px] font-bold tracking-wide text-[#52634d]">ILLUSTRATIVE ROUTE · DEMO</span>
      <span className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-[10px] text-[#52634d]">Location freshness unavailable</span>
      {setZoom && <div className="absolute right-3 bottom-3 flex flex-col rounded-lg bg-white shadow-sm"><button aria-label="Zoom map in" className="icon-btn" disabled={zoom >= 1.8} onClick={() => setZoom(Math.min(1.8, zoom + .2))}><Plus size={17}/></button><button aria-label="Zoom map out" className="icon-btn" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .2))}><Minus size={17}/></button></div>}
    </div><div className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Truck size={20}/></span><div><p className="text-xs font-bold">K. Senthil <span className="font-normal text-muted">· Driver</span></p><p className="mt-1 text-[11px] text-muted">32 ft Container · TN 01 AB 2048</p></div></div><div><p className="text-[9px] font-bold tracking-wider text-muted">SAMPLE ETA</p><p className="mt-1 text-xs font-semibold">22 Oct, 6:30 PM IST</p></div></div>
  </Card>;
}

export function Timeline({ items, action }: { items: { label: string; detail: string; time: string; state: string }[]; action?: () => void }) {
  return <Card title="Every milestone matters" subtitle="Shipment journey · ZP-2048" action={<MapPin size={18} className="text-muted"/>}><ol className="px-6 pt-2 pb-3">{items.map((m, i) => <li key={m.label} className={`relative ml-2 pl-6 ${i < items.length - 1 ? 'border-l border-line pb-6' : 'pb-2'}`} aria-current={m.state === 'current' ? 'step' : undefined}><span className={`absolute top-0 -left-[7px] grid size-3.5 place-items-center rounded-full border-2 border-white ${m.state === 'done' ? 'bg-success' : m.state === 'current' ? 'bg-brand ring-4 ring-brand-soft' : 'bg-line'}`}>{m.state === 'done' && <Check size={9} className="text-white"/>}</span><div className="flex flex-wrap justify-between gap-x-2 gap-y-1"><h3 className="text-xs font-bold">{m.label}</h3><span className="text-[10px] text-muted">{m.time}</span></div><p className="mt-1.5 text-[11px] leading-relaxed text-muted">{m.detail}</p></li>)}</ol><div className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-1.5"><span className="flex items-center gap-1.5 text-[11px] text-muted"><Clock3 size={13}/> Sample trip · 346 km</span>{action && <button className="text-btn" onClick={action}>View details <ArrowRight size={14}/></button>}</div></Card>;
}
