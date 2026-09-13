import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { useSession } from './SessionProvider';

export interface AuthGateContextType {
  requireAuth: (actionName?: string, onAuthenticated?: () => void) => boolean;
  openAuthModal: (mode?: 'signup' | 'login', onAuthenticated?: () => void, notice?: string) => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'signup' | 'login';
  actionNotice: string;
  handleAuthSuccess: () => void;
}

const AuthGateContext = createContext<AuthGateContextType | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login'>('signup');
  const [actionNotice, setActionNotice] = useState('');
  const pendingActionRef = useRef<(() => void) | null>(null);

  const openAuthModal = useCallback(
    (mode: 'signup' | 'login' = 'signup', onAuthenticated?: () => void, notice = '') => {
      pendingActionRef.current = onAuthenticated ?? null;
      setActionNotice(notice);
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setActionNotice('');
  }, []);

  const requireAuth = useCallback(
    (actionName?: string, onAuthenticated?: () => void): boolean => {
      if (session) {
        onAuthenticated?.();
        return true;
      }
      openAuthModal('signup', onAuthenticated, actionName ? `Please sign in to ${actionName}.` : '');
      return false;
    },
    [session, openAuthModal]
  );

  const handleAuthSuccess = useCallback(() => {
    setAuthModalOpen(false);
    setActionNotice('');
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      // Continue pending action after authentication settlement
      setTimeout(() => {
        try {
          action();
        } catch (err) {
          console.error('Error executing action after auth:', err);
        }
      }, 150);
    }
  }, []);

  return (
    <AuthGateContext.Provider
      value={{
        requireAuth,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
        actionNotice,
        handleAuthSuccess,
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error('useAuthGate must be used within an AuthGateProvider');
  }
  return context;
}
