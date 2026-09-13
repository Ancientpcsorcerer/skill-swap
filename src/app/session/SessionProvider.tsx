import { createContext, useContext, useState, type ReactNode } from 'react';
import { localAuth, type AuthProvider, type Credentials } from './auth';
import type { User } from '../data/models';
export type ProfileIdentity = User;
export interface ApplicationSession { mode: 'local'; identity: User }
const SessionContext = createContext<{ session: ApplicationSession | null; signUp: (input: Credentials) => Promise<void>; login: (email: string, password: string) => Promise<void>; logout: () => void; updateProfile: (patch: Partial<User>) => void } | null>(null);
export function SessionProvider({ children, provider = localAuth }: { children: ReactNode; provider?: AuthProvider }) {
  const [session, setSession] = useState<ApplicationSession | null>(() => { const identity = provider.restore(); return identity ? { mode: 'local', identity } : null; });
  return <SessionContext.Provider value={{ session,
    signUp: async input => { const identity = await provider.signUp(input); setSession({ mode: 'local', identity }); },
    login: async (email, password) => { const identity = await provider.login(email, password); setSession({ mode: 'local', identity }); },
    logout: () => { provider.logout(); setSession(null); },
    updateProfile: patch => { if (session) { const identity = provider.update({ ...session.identity, ...patch, id: session.identity.id, email: session.identity.email }); setSession({ mode: 'local', identity }); } },
  }}>{children}</SessionContext.Provider>;
}
export function useSession() { const context = useContext(SessionContext); if (!context) throw new Error('SessionProvider is required'); return context; }
