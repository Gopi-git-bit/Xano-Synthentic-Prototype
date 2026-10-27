import { useEffect, useState, type FormEvent } from 'react';
import { LockKeyhole, LogOut } from 'lucide-react';
import { api, clearSession, signIn, type User } from './api';
import { Card, Field, Notice, PageIntro } from './components';
import CRM from './CRM';

export default function Access() {
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let active = true;
    api<{ authenticationConfigured: boolean }>('status').then(r => { if (active) { setConfigured(r.authenticationConfigured); setLoading(false); } }).catch(e => { if (active) { setError(e.message); setLoading(false); } });
    return () => { active = false; };
  }, [retry]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); setLoading(true); setError('');
    try { const result = await signIn(mode, { email: String(data.get('email')), password: String(data.get('password')), ...(mode === 'signup' ? { name: String(data.get('name')) } : {}) }); form.reset(); setUser(result.user); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  if (user) return <main data-role={user.role === 'admin' ? 'admin' : 'customer'} className="min-h-dvh bg-canvas p-4 text-ink sm:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-wrap items-center justify-between gap-4"><span className="font-bold">Zippy · {user.name}</span><button className="btn" onClick={() => { clearSession(); setUser(null); }}><LogOut size={16}/> Sign out</button></header>{user.role === 'admin' ? <CRM/> : <><PageIntro title="Your account is verified." subtitle="Workspace assignment is pending."/><Notice>The current Xano contract returns a member role. Customer/Vehicle Owner permissions, assigned records and logistics APIs must be connected before operational access is available.</Notice></>}</div></main>;
  return <main data-role="customer" className="grid min-h-dvh place-items-center bg-canvas p-4 text-ink sm:p-8"><Card className="w-full max-w-lg"><div className="space-y-6 p-6 sm:p-9"><div className="brand"><span className="brand-mark">z</span><span className="text-3xl font-bold">zippy</span></div><LockKeyhole className="text-brand"/><h1 className="text-3xl font-bold">A secure start to every journey.</h1><p className="text-sm text-muted">{mode === 'login' ? 'Sign in with your Zippy account.' : 'Create an account. Workspace permissions are assigned separately.'}</p>
    {!configured && !loading && <Notice>Account access is not configured. Protected orders, payments and admin operations are unavailable.</Notice>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <form className="space-y-4" onSubmit={submit}>
      {mode === 'signup' && <Field label="Full name"><input name="name" autoComplete="name" maxLength={100} required/></Field>}
      <Field label="Email"><input name="email" type="email" autoComplete="email" maxLength={254} required/></Field>
      <Field label="Password"><input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={256} required/></Field>
      <button className="btn primary w-full" disabled={loading || !configured}>{loading ? 'Connecting…' : !configured ? 'Sign in unavailable' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      {loading && <p role="status" className="text-xs text-muted">Waiting for the authentication service…</p>}
    </form><div className="flex flex-wrap gap-3"><button className="text-btn" disabled={loading} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Register an account' : 'Back to sign in'}</button><button className="text-btn" disabled={loading} onClick={() => { setLoading(true); setError(''); setRetry(retry + 1); }}>Retry connection</button></div>
  </div></Card></main>;
}
