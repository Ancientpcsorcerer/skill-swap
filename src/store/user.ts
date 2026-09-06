// Current user state — fake auth, localStorage-persisted
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  teaches: string[];
  learns: string[];
  hoursGiven: number;
  hoursReceived: number;
  trust: 'new' | 'established' | 'trusted';
  joinedAt: string;
  onboardedAt?: string;
}

interface UserState {
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  updateProfile: (patch: Partial<CurrentUser>) => void;
  signOut: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      updateProfile: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      signOut: () => set({ user: null }),
    }),
    { name: 'skillswap.user' },
  ),
);
