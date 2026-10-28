import { useEffect, useState, type FormEvent } from 'react';
import { LockKeyhole, LogOut } from 'lucide-react';
import { api, clearSession, onSessionEnd, signIn, type ServiceStatus, type User } from './api';
import { Card, Field, Notice, PageIntro } from './components';
import CRM from './CRM';
import Bookings from './Bookings';

export default function Access() {
  const [configured, setConfigured] = useState(false);
  const [bookingReadsAvailable, setBookingReadsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onSessionEnd(reason => {
    setUser(null);
    if (reason === 'expired') {
      setError('Your session has ended. Sign in again to continue.'); setMode('login');
      setConfigured(false); setBookingReadsAvailable(false); setLoading(true); setRetry(value => value + 1);
    }
  }), []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    api<ServiceStatus>('status', undefined, { signal: controller.signal }).then(r => { if (active) { setConfigured(r.authenticationAvailable === true); setBookingReadsAvailable(r.bookingReadsAvailable === true); setLoading(false); } }).catch(e => { if (active) { setConfigured(false); setBookingReadsAvailable(false); setError(e.message); setLoading(false); } });
    return () => { active = false; controller.abort(); };
  }, [retry]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); setLoading(true); setError('');
    try { const result = await signIn(mode, { email: String(data.get('email')), password: String(data.get('password')), ...(mode === 'signup' ? { name: String(data.get('name')) } : {}) }); form.reset(); setUser(result.user); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  if (user) return <main data-role={user.workspace} className="min-h-dvh bg-canvas p-4 text-ink sm:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-wrap items-center justify-between gap-4"><span className="font-bold">Zippy · {user.name}</span><button className="btn" onClick={() => { clearSession(); setUser(null); }}><LogOut size={16}/> Sign out</button></header>{user.workspace === 'admin' ? <CRM/> : user.workspace === 'customer' ? <Bookings available={bookingReadsAvailable}/> : <><PageIntro title="Your account is verified." subtitle="Assigned-work integration is pending."/><Notice>Vehicle Owner assignment, execution and financial permissions require verified API contracts. No job, vehicle or earnings records are loaded.</Notice></>}</div></main>;
  return <main data-role="customer" className="grid min-h-dvh place-items-center bg-canvas p-4 text-ink sm:p-8"><Card className="w-full max-w-lg"><div className="space-y-6 p-6 sm:p-9"><div className="brand"><span className="brand-mark">z</span><span className="text-3xl font-bold">zippy</span></div><LockKeyhole className="text-brand"/><h1 className="text-3xl font-bold">A secure start to every journey.</h1><p className="text-sm text-muted">{mode === 'login' ? 'Sign in with your Zippy account.' : 'Create an account. Workspace permissions are assigned separately.'}</p>
    {!configured && !loading && <Notice>Account access is unavailable pending Xano authentication security and permission verification. Protected orders, payments and admin operations are unavailable.</Notice>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <form className="space-y-4" onSubmit={submit}>
      {mode === 'signup' && <Field label="Full name"><input disabled={!configured || loading} name="name" autoComplete="name" maxLength={100} required/></Field>}
      <Field label="Email"><input disabled={!configured || loading} name="email" type="email" autoComplete="email" maxLength={254} required/></Field>
      <Field label="Password"><input disabled={!configured || loading} name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={256} required/></Field>
      <button className="btn primary w-full" disabled={loading || !configured}>{loading ? 'Connecting…' : !configured ? 'Sign in unavailable' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      {loading && <p role="status" className="text-xs text-muted">Waiting for the authentication service…</p>}
    </form><div className="flex flex-wrap gap-3"><button className="text-btn" disabled={loading} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Register an account' : 'Back to sign in'}</button><button className="text-btn" disabled={loading} onClick={() => { setLoading(true); setError(''); setRetry(retry + 1); }}>Retry connection</button></div>
  </div></Card></main>;
}
