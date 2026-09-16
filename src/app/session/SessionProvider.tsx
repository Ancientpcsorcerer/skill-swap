import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { localAuth, type AuthProvider, type Credentials } from './auth';
import type { User } from '../data/models';
import { authenticateWithGoogle, authenticateWithGitHub } from '../../lib/firebaseAuth';
import { api, getApiToken, setApiToken } from '../../lib/api';

export type ProfileIdentity = User;
export interface ApplicationSession { mode: 'local'; identity: User }
export type AuthStatus = 'AUTH_INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

export interface SessionContextType {
  session: ApplicationSession | null;
  status: AuthStatus;
  signUp: (input: Credentials) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithGitHub: () => Promise<User>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children, provider = localAuth }: { children: ReactNode; provider?: AuthProvider }) {
  const [session, setSession] = useState<ApplicationSession | null>(() => {
    const identity = provider.restore();
    return identity ? { mode: 'local', identity } : null;
  });

  const [status, setStatus] = useState<AuthStatus>(() => {
    return getApiToken() ? 'AUTH_INITIALIZING' : 'UNAUTHENTICATED';
  });

  // Verify active token and synchronize authoritative user on mount
  useEffect(() => {
    const token = getApiToken();
    if (!token) {
      setStatus('UNAUTHENTICATED');
      setSession(null);
      return;
    }

    let active = true;
    api.auth
      .me()
      .then((serverUser) => {
        if (active && serverUser) {
          setSession({ mode: 'local', identity: serverUser });
          setStatus('AUTHENTICATED');
        }
      })
      .catch(() => {
        if (active) {
          setApiToken(null);
          setSession(null);
          setStatus('UNAUTHENTICATED');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        status,
        signUp: async (input) => {
          const identity = await provider.signUp(input);
          setSession({ mode: 'local', identity });
          setStatus('AUTHENTICATED');
        },
        login: async (email, password) => {
          const identity = await provider.login(email, password);
          setSession({ mode: 'local', identity });
          setStatus('AUTHENTICATED');
        },
        signInWithGoogle: async () => {
          const user = await authenticateWithGoogle();
          setSession({ mode: 'local', identity: user });
          setStatus('AUTHENTICATED');
          return user;
        },
        signInWithGitHub: async () => {
          const user = await authenticateWithGitHub();
          setSession({ mode: 'local', identity: user });
          setStatus('AUTHENTICATED');
          return user;
        },
        logout: () => {
          provider.logout();
          setSession(null);
          setStatus('UNAUTHENTICATED');
        },
        updateProfile: (patch) => {
          if (session) {
            const identity = provider.update({
              ...session.identity,
              ...patch,
              id: session.identity.id,
              email: session.identity.email,
            });
            setSession({ mode: 'local', identity });
          }
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider is required');
  return context;
}
