import type { User } from '../data/models';
import { api } from '../../lib/api';
import { localAuth, type AuthProvider, type Credentials } from './auth';

const ACTIVE_USER_CACHE_KEY = 'skill-swap.active-user.v1';

export const apiAuth: AuthProvider = {
  restore(): User | null {
    // Check cached active user first
    try {
      const cached = localStorage.getItem(ACTIVE_USER_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback
    }

    // Fallback to localAuth
    return localAuth.restore();
  },

  async signUp(input: Credentials): Promise<User> {
    try {
      const user = await api.auth.register(input);
      localStorage.setItem(ACTIVE_USER_CACHE_KEY, JSON.stringify(user));
      return user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If network error (backend unreachable), fallback to localAuth
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        console.warn('⚠️ Backend unreachable, falling back to local auth');
        return localAuth.signUp(input);
      }
      throw err;
    }
  },

  async login(email: string, password: string): Promise<User> {
    try {
      const user = await api.auth.login(email, password);
      localStorage.setItem(ACTIVE_USER_CACHE_KEY, JSON.stringify(user));
      return user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If network error, fallback to localAuth
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        console.warn('⚠️ Backend unreachable, falling back to local auth');
        return localAuth.login(email, password);
      }
      throw err;
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(ACTIVE_USER_CACHE_KEY);
      api.auth.logout().catch(() => {});
    } finally {
      localAuth.logout();
    }
  },

  update(user: User): User {
    localStorage.setItem(ACTIVE_USER_CACHE_KEY, JSON.stringify(user));
    // Asynchronously update profile on server
    api.profile.update(user).catch((err) => {
      console.warn('Could not sync profile update to backend:', err);
    });
    return localAuth.update(user);
  },
};
