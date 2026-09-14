import { useState, type FormEvent } from 'react';
import { Artwork } from '../../app/components/Artwork';
import { useSession } from '../../app/session/SessionProvider';
import { navigate, type ModuleId } from '../../app/navigation';

export function AuthModule({
  mode = 'signup',
  next,
}: {
  mode?: 'signup' | 'login';
  next?: ModuleId;
}) {
  const { signUp, login, signInWithGoogle, signInWithGitHub } = useSession();
  const [currentMode, setCurrentMode] = useState<'signup' | 'login'>(mode);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Preset demo accounts for quick testing
  const demoAccounts = [
    { name: 'Aarav Sharma', email: 'aarav@example.com', role: 'Robotics & AI' },
    { name: 'Ishita Rao', email: 'ishita@example.com', role: 'Product Design' },
    { name: 'Rohan Kulkarni', email: 'rohan@example.com', role: 'Embedded Systems' },
  ];

  function quickFill(demoEmail: string, demoName: string) {
    setEmail(demoEmail);
    setPassword('Password123!');
    setName(demoName);
    setCurrentMode('login');
    setError('');
    setNotice(`Loaded demo credentials for ${demoName}`);
  }

  async function handleSocialAuth(provider: 'Google' | 'GitHub') {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (provider === 'Google') {
        await signInWithGoogle();
      } else {
        await signInWithGitHub();
      }
      navigate(next ?? 'connect');
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} authentication failed.`);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (currentMode === 'signup') {
        await signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await login(email.trim(), password);
      }
      navigate(next ?? 'connect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen animated-auth-screen">
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-glow" />
        <Artwork art="signup" />
      </aside>

      <section className="auth-body">
        <div className="auth-card-container">
          <a
            className="workspace-brand auth-brand-link"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              navigate(null);
            }}
          >
            SKILL SWAP
          </a>

          {/* Mode Switcher Tabs */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={currentMode === 'signup'}
              className={`auth-tab ${currentMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setCurrentMode('signup');
                setError('');
                setNotice('');
              }}
            >
              Create Account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentMode === 'login'}
              className={`auth-tab ${currentMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setCurrentMode('login');
                setError('');
                setNotice('');
              }}
            >
              Sign In
            </button>
          </div>

          <div className="auth-header-text">
            <h1>{currentMode === 'signup' ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</h1>
            <p>Connect, share skills, and build real-world projects with creators worldwide.</p>
          </div>

          {/* Social Auth Providers */}
          <div className="social-auth-grid">
            <button
              type="button"
              className="social-button google-button"
              onClick={() => handleSocialAuth('Google')}
              disabled={busy}
              aria-label="Continue with Google"
              style={{ color: '#141514' }}
            >
              <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-4.9L1.9 16.8C3.7 20.6 7.5 23.5 12 23.5z"
                />
              </svg>
              <span style={{ color: '#141514', fontWeight: 600 }}>Continue with Google</span>
            </button>

            <button
              type="button"
              className="social-button github-button"
              onClick={() => handleSocialAuth('GitHub')}
              disabled={busy}
              aria-label="Continue with GitHub"
              style={{ color: '#141514' }}
            >
              <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20" fill="#141514" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span style={{ color: '#141514', fontWeight: 600 }}>Continue with GitHub</span>
            </button>
          </div>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-label">OR WITH EMAIL</span>
            <span className="auth-divider-line" />
          </div>

          <form className="auth-form-animated" onSubmit={submit}>
            {currentMode === 'signup' && (
              <div className="input-group">
                <label htmlFor="name-input">Name</label>
                <div className="input-field-wrapper">
                  <input
                    id="name-input"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email-input">Email</label>
              <div className="input-field-wrapper">
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  maxLength={200}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password-input">Password</label>
                {currentMode === 'signup' && <span className="password-hint">Min 8 chars</span>}
              </div>
              <div className="input-field-wrapper">
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete={currentMode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={8}
                  maxLength={200}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="animated-alert form-error-alert">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div role="status" className="animated-alert form-notice-alert">
                <span className="alert-icon">✨</span>
                <span>{notice}</span>
              </div>
            )}

            <button className="pill primary-cta auth-submit-btn" type="submit" disabled={busy}>
              {busy ? (
                <span className="btn-spinner-content">
                  <span className="mini-spinner" /> Connecting...
                </span>
              ) : currentMode === 'signup' ? (
                'SIGN UP'
              ) : (
                'LOG IN'
              )}
            </button>

            <p className="auth-switch" style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--sw-ink-muted)' }}>
              {currentMode === 'signup' ? 'Already have an account?' : 'New to Skill Swap?'}{' '}
              <button
                type="button"
                className="quiet-button"
                style={{ fontWeight: 700, color: 'var(--sw-ink-primary)', textDecoration: 'underline' }}
                onClick={() => {
                  setError('');
                  setNotice('');
                  const target = currentMode === 'signup' ? 'login' : 'signup';
                  setCurrentMode(target);
                  navigate(target, next);
                }}
              >
                {currentMode === 'signup' ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </form>

          {/* Quick Demo Login Pill Bar */}
          <div className="demo-credentials-section">
            <span className="demo-credentials-title">⚡ QUICK LOGIN DEMO ACCOUNTS</span>
            <div className="demo-pills-row">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  className="demo-account-pill"
                  onClick={() => quickFill(demo.email, demo.name)}
                  title={`Click to fill ${demo.name}'s credentials`}
                >
                  <span className="demo-pill-name">{demo.name.split(' ')[0]}</span>
                  <span className="demo-pill-role">{demo.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
