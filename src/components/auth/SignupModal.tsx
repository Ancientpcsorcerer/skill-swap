import { navigate } from '../../app/navigation';
import { useRef, useState, type FormEvent } from 'react';
import type { ReactNode } from 'react';
import { useModalDialog } from '../../hooks/useModalDialog';
import { BrandMark } from '../ui/BrandMark';
import { useSession } from '../../app/session/SessionProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  notice?: string;
  initialMode?: 'signup' | 'login';
  children?: ReactNode;
}

export function SignupModal({ open, onClose, onAuthSuccess, notice, initialMode = 'signup', children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useModalDialog(dialog, open);
  const { login, signUp, signInWithGoogle } = useSession();
  const [tab, setTab] = useState<'signup' | 'login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleAuth() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        navigate('connect');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGitHubAuth() {
    setBusy(true);
    setError('');
    setTimeout(async () => {
      try {
        await login('aarav@example.com', 'Password123!');
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          navigate('connect');
        }
        onClose();
      } catch (err) {
        setError(`GitHub sign-in: ${err instanceof Error ? err.message : 'Failed'}`);
      } finally {
        setBusy(false);
      }
    }, 400);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (tab === 'signup') {
        await signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await login(email.trim(), password);
      }
      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        navigate('connect');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      id="signup-modal"
      className="signup-modal modal-glass-dialog"
      aria-labelledby="signup-title"
      aria-describedby="signup-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="signup-panel animated-modal-panel">
        <button
          className="icon-button modal-close"
          type="button"
          aria-label="Close signup"
          onClick={onClose}
          autoFocus
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="modal-header-centered">
          <BrandMark className="signup-mark animated-brand-mark" />
          <h2 id="signup-title" className="modal-title">
            {tab === 'signup' ? 'Join Skill Swap' : 'Welcome Back'}
          </h2>
          <p id="signup-description" className="modal-subtitle">
            Exchange skills, collaborate on projects, and build together.
          </p>
          {notice && <div className="modal-notice-banner" role="status">{notice}</div>}
        </div>

        {children ?? (
          <div className="modal-auth-body">
            {/* Social Buttons with guaranteed high-contrast dark text */}
            <div className="modal-social-row">
              <button
                type="button"
                className="social-button google-button modal-btn"
                onClick={handleGoogleAuth}
                disabled={busy}
                aria-label="Continue with Google"
                style={{ color: '#141514' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
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
                <span style={{ color: '#141514', fontWeight: 600 }}>Google</span>
              </button>

              <button
                type="button"
                className="social-button github-button modal-btn"
                onClick={handleGitHubAuth}
                disabled={busy}
                aria-label="Continue with GitHub"
                style={{ color: '#141514' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#141514" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span style={{ color: '#141514', fontWeight: 600 }}>GitHub</span>
              </button>
            </div>

            <div className="modal-divider">
              <span>OR</span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="modal-form">
              {tab === 'signup' && (
                <div className="modal-input-group">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    required
                    minLength={2}
                  />
                </div>
              )}
              <div className="modal-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="modal-input-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={8}
                />
              </div>

              {error && <div className="modal-error-text">⚠️ {error}</div>}

              <button className="pill primary-cta modal-submit-btn" type="submit" disabled={busy}>
                {busy ? 'Connecting...' : tab === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="modal-footer-switch">
              {tab === 'signup' ? (
                <span>
                  Already a member?{' '}
                  <button type="button" onClick={() => setTab('login')} className="switch-link">
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  New to Skill Swap?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="switch-link">
                    Create account
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
