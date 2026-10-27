import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, ShieldCheck } from 'lucide-react';
import { Card, DetailRows, Field, Notice, PageIntro } from '../components';
import type { Booking } from '../types';
import { cities, vehicles } from './data';

export const istNow = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 16);

export default function BookingFlow({ booking, setBooking, onSave, onCancel }: { booking: Booking; setBooking: (next: Booking) => void; onSave: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const change = (key: keyof Booking, value: string) => setBooking({ ...booking, [key]: value });
  const field = (label: string, key: keyof Booking, type = 'text', placeholder = '', required = true) => <Field label={label}><input name={key} type={type} value={booking[key]} required={required} placeholder={placeholder} aria-invalid={Boolean(error && type === 'tel')} onChange={e => { setError(''); change(key, e.target.value); }} /></Field>;
  function next(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let message = '';
    if (step === 0) {
      if ([booking.from, booking.to, booking.pickup, booking.delivery].some(v => !v.trim())) message = 'Enter both cities and complete pickup and delivery addresses.';
      else if (booking.pickup.trim().toLowerCase() === booking.delivery.trim().toLowerCase() && booking.from.trim().toLowerCase() === booking.to.trim().toLowerCase()) message = 'Pickup and delivery must be different locations.';
      else if ([booking.sender, booking.receiver].some(v => !/^[+\d\s()-]+$/.test(v) || v.replace(/\D/g, '').length < 10 || v.replace(/\D/g, '').length > 15)) message = 'Enter a valid sender and receiver phone number (10–15 digits).';
    }
    if (step === 1 && (!booking.cargo.trim() || !Number.isFinite(Number(booking.weight)) || Number(booking.weight) <= 0)) message = 'Add a cargo description and a weight greater than zero.';
    if (step === 2 && !booking.payer.trim()) message = 'Enter the name of the designated payer.';
    if (step === 2 && booking.schedule === 'Custom time' && (!booking.when || booking.when < istNow())) message = 'Select a future pickup time in IST.';
    if (message) { setError(message); return; }
    setError('');
    if (step < 3) setStep(step + 1); else onSave();
  }
  return <>
    <PageIntro title="Make your next move." subtitle="A few details. A better booking experience." />
    <ol className="mb-7 grid grid-cols-4 gap-2" aria-label="Booking progress">{['Route', 'Cargo', 'Schedule', 'Review'].map((label, i) => <li key={label} className={`flex flex-wrap items-center gap-2 text-xs ${i === step ? 'font-bold text-brand' : 'text-muted'}`} aria-current={i === step ? 'step' : undefined}><span className={`grid size-8 place-items-center rounded-full ${i === step ? 'bg-brand text-white' : 'bg-brand-soft'}`}>{i < step ? <Check size={15}/> : i + 1}</span>{label}</li>)}</ol>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
      <Card><form onSubmit={next} className="p-5 sm:p-7" aria-label={`Booking step ${step + 1}`}>
        <h2 className="text-lg font-bold">{['Where are we headed?', 'The right fit for your freight.', 'A time and payment plan that fits.', 'Everything look right?'][step]}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">{['Add exact addresses and the people at each end.', 'Tell us what you’re moving. Eligibility is confirmed by the service.', 'Schedule in India Standard Time (UTC +05:30).', 'Review your details. A verified quote is required before booking.'][step]}</p>
        {error && <p className="mt-5 rounded-lg bg-[#fcebed] p-3 text-sm text-danger" role="alert">{error}</p>}
        {step === 0 && <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Pickup city"><input name="from" list="city-options" value={booking.from} onChange={e => change('from', e.target.value)} placeholder="Search or type a city" required autoComplete="address-level2" /></Field>
          <Field label="Delivery city"><input name="to" list="city-options" value={booking.to} onChange={e => change('to', e.target.value)} placeholder="Search or type a city" required /></Field>
          <datalist id="city-options">{cities.map(c => <option key={c} value={c}/>)}</datalist>
          {field('Exact pickup address', 'pickup', 'text', 'Building, street, area and PIN code')}
          {field('Exact delivery address', 'delivery', 'text', 'Building, street, area and PIN code')}
          {field('Sender contact', 'sender', 'tel', '+91 98765 43210')}
          {field('Receiver contact', 'receiver', 'tel', '+91 98765 43210')}
          <div className="rounded-xl border border-dashed border-line bg-canvas p-4 sm:col-span-2"><div className="flex items-center gap-2 text-sm font-semibold"><MapPin size={17} className="text-brand"/> Pin your exact locations</div><p className="mt-2 text-xs leading-relaxed text-muted">City suggestions are local. Address search, map pins and route validation need the approved geocoding service.</p><button type="button" disabled className="btn mt-3">Map lookup unavailable</button></div>
        </div>}
        {step === 1 && <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Vehicle type"><select value={booking.vehicle} onChange={e => change('vehicle', e.target.value)}>{vehicles.map(v => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Body type"><select value={booking.body} onChange={e => change('body', e.target.value)}><option>Closed</option><option>Open</option></select></Field>
          {field('Cargo description', 'cargo', 'text', 'e.g. Packed textile rolls')}
          <Field label="Weight (tonnes)"><input name="weight" type="number" inputMode="decimal" min="0.001" step="any" value={booking.weight} onChange={e => change('weight', e.target.value)} required placeholder="e.g. 3.5" /></Field>
          {field('Dimensions (optional)', 'dimensions', 'text', 'L × W × H, with units', false)}
          <Field label="Loading / unloading"><select value={booking.handling} onChange={e => change('handling', e.target.value)}><option>Customer arranged</option><option>Assistance requested</option></select></Field>
          <div className="sm:col-span-2"><Field label="Special instructions (optional)"><textarea value={booking.notes} onChange={e => change('notes', e.target.value)} placeholder="Handling needs, access restrictions or packaging details" /></Field></div>
          <p className="text-xs leading-relaxed text-muted sm:col-span-2">Vehicle names match the published reference. Final catalog, capacity and body compatibility require backend confirmation.</p>
        </div>}
        {step === 2 && <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Pickup schedule"><select value={booking.schedule} onChange={e => change('schedule', e.target.value)}><option>Immediate</option><option>Custom time</option></select></Field>
          <Field label="Pickup date and time (IST)"><input type="datetime-local" min={istNow()} value={booking.when} disabled={booking.schedule !== 'Custom time'} required={booking.schedule === 'Custom time'} onChange={e => change('when', e.target.value)} /></Field>
          <Field label="Requested payment arrangement"><select value={booking.mode} onChange={e => change('mode', e.target.value)}><option>Full payment</option><option>Partial payment</option><option>ToPay</option></select></Field>
          {field('Designated payer', 'payer', 'text', 'Full name or company')}
          <div className="sm:col-span-2"><Notice>Payment arrangements are requests, subject to policy. Partial-payment amounts, ToPay eligibility and taxes will come from an approved quote.</Notice></div>
        </div>}
        {step === 3 && <div className="mt-5 space-y-5">
          <DetailRows rows={[
            ['Route', `${booking.from} → ${booking.to}`], ['Pickup address', booking.pickup], ['Delivery address', booking.delivery],
            ['Sender / receiver', `${booking.sender} / ${booking.receiver}`], ['Vehicle / body', `${booking.vehicle} · ${booking.body}`],
            ['Cargo', `${booking.cargo} · ${booking.weight} tonnes`], ['Dimensions', booking.dimensions || 'Not specified'],
            ['Handling', booking.handling], ['Instructions', booking.notes || 'None'], ['Pickup', booking.schedule === 'Custom time' ? `${booking.when.replace('T', ' · ')} IST` : 'Immediate'],
            ['Payer', booking.payer], ['Requested arrangement', booking.mode],
          ]}/>
          <Notice>Save a draft to review the experience. No vehicle is booked and no payment is initiated.</Notice>
        </div>}
        <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-line pt-5"><button type="button" className="btn" onClick={() => { setError(''); if (step > 0) setStep(step - 1); else onCancel(); }}><ArrowLeft size={15}/>{step ? 'Back' : 'Return home'}</button><button className="btn primary" type="submit">{step === 3 ? 'Save preview draft' : 'Continue'} <ArrowRight size={15}/></button></div>
      </form></Card>
      <aside className="card h-fit p-6"><p className="eyebrow">YOUR BOOKING</p><h2 className="text-lg font-bold">A clear road ahead.</h2><DetailRows rows={[
        ['Pickup', booking.from || 'Choose location'], ['Delivery', booking.to || 'Choose location'], ['Vehicle', booking.vehicle],
      ]}/><h3 className="mt-5 text-sm font-bold">Quote breakdown</h3><DetailRows rows={[
        ['Transport & charges', 'Awaiting verified quote'], ['Tax', 'Not calculated'], ['Amount due now', 'Awaiting verified quote'], ['Remaining balance', 'Awaiting verified quote'],
      ]}/><div className="mt-5 flex gap-2 text-xs leading-relaxed text-muted"><ShieldCheck size={18} className="text-brand"/><p>Rates and amounts are never inferred from the visual references.</p></div><button className="btn mt-5 w-full" disabled>Request quote unavailable</button></aside>
    </div>
  </>;
}
