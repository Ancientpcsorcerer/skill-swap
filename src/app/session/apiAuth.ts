import type { User } from '../data/models';
import { api, getApiToken, setApiToken } from '../../lib/api';
import type { AuthProvider, Credentials } from './auth';

const ACTIVE_USER_CACHE_KEY = 'skill-swap.active-user.v1';

export const apiAuth: AuthProvider = {
  restore(): User | null {
    // Only restore active user if a valid bearer token is present
    const token = getApiToken();
    if (!token) return null;

    try {
      const cached = localStorage.getItem(ACTIVE_USER_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback
    }

    return null;
  },

  async signUp(input: Credentials): Promise<User> {
    const user = await api.auth.register(input);
    localStorage.setItem(ACTIVE_USER_CACHE_KEY, JSON.stringify(user));
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const user = await api.auth.login(email, password);
    localStorage.setItem(ACTIVE_USER_CACHE_KEY, JSON.stringify(user));
    return user;
  },

  logout(): void {
    try {
      localStorage.removeItem(ACTIVE_USER_CACHE_KEY);
      api.auth.logout().catch(() => {});
    } finally {
      setApiToken(null);
    }
  },

  update(user: User): User {
    localStorage.setItem(ACTIVE_USER_CACHE_KEY, JSON.stringify(user));
    // Asynchronously update profile on server
    api.profile.update(user).catch((err) => {
      console.warn('Could not sync profile update to backend:', err);
    });
    return user;
  },
};
