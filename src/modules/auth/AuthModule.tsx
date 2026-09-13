import { useState, type FormEvent } from 'react';
import { Artwork } from '../../app/components/Artwork';
import { useSession } from '../../app/session/SessionProvider';
import { navigate, type ModuleId } from '../../app/navigation';
export function AuthModule({ mode = 'signup', next }: { mode?: 'signup' | 'login'; next?: ModuleId }) {
  const { signUp, login } = useSession(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError('');
    try { if (mode === 'signup') await signUp({ name: String(data.get('name')), email: String(data.get('email')), password: String(data.get('password')) }); else await login(String(data.get('email')), String(data.get('password'))); form.reset(); navigate(next ?? 'profile'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <main className="auth-screen"><aside className="auth-art" aria-hidden="true"><Artwork art="signup" /></aside><section className="auth-body">
    <a className="workspace-brand" href="#" onClick={event => { event.preventDefault(); navigate(null); }}>SKILL SWAP</a>
    <form className="auth-form" onSubmit={submit}><h1>{mode === 'signup' ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</h1><p>Be a part of a global community of builders, learners and changemakers.</p>
      {mode === 'signup' && <label>Name<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} maxLength={200} required aria-describedby={mode === 'signup' ? 'password-help' : undefined} /></label>
      {mode === 'signup' && <span id="password-help" className="input-hint">At least 8 characters</span>}
      {error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Please wait...' : mode === 'signup' ? 'SIGN UP' : 'LOG IN'}</button>
      <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Skill Swap?'} <button type="button" onClick={() => { setError(''); navigate(mode === 'signup' ? 'login' : 'signup', next); }}>{mode === 'signup' ? 'Log in' : 'Sign up'}</button></p>
      <p className="auth-storage-note">Your profile is saved on this device.</p>
    </form></section></main>;
}
