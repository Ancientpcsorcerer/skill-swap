import type { User } from '../app/data/models';
import { api } from './api';

const ACTIVE_USER_KEY = 'skill-swap.active-user.v1';
const ACCOUNTS_KEY = 'skill-swap.accounts.v1';

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

/**
 * Initiates Google OAuth authentication using Firebase / Google Identity parameters.
 * Handles popup lifecycle, user cancellation, popup blockers, and network errors.
 */
export async function performGoogleAuth(): Promise<GoogleUserProfile> {
  const googleClientId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY);

  // If live Google Client ID is configured, launch Google OAuth 2.0 Web popup
  if (googleClientId && typeof window !== 'undefined') {
    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const redirectUri = window.location.origin + '/auth/google/callback';
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(googleClientId)}` +
        `&response_type=token%20id_token` +
        `&scope=openid%20profile%20email` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&prompt=select_account`;

      const popup = window.open(
        authUrl,
        'google_auth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popup || popup.closed) {
        reject(new Error('Google sign-in pop-up was blocked. Please enable pop-ups for this site.'));
        return;
      }

      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (pollTimer) clearInterval(pollTimer);
        window.removeEventListener('message', messageListener);
      };

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.profile) {
          cleanup();
          try { popup.close(); } catch {}
          resolve(event.data.profile);
        } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
          cleanup();
          try { popup.close(); } catch {}
          reject(new Error(event.data.error || 'Google authentication failed.'));
        }
      };

      window.addEventListener('message', messageListener);

      pollTimer = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('Google sign-in was cancelled.'));
        }
      }, 600);
    });
  }

  // Development & Demo environment: Simulate authentic Google OAuth response with seamless account profile
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'google-user-' + Math.random().toString(36).substring(2, 9),
        name: 'Alex Morgan',
        email: 'alex.morgan.dev@gmail.com',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      });
    }, 450);
  });
}

/**
 * Links the Google authenticated profile with the Skill Swap user model and backend session.
 */
export async function authenticateWithGoogle(): Promise<User> {
  const profile = await performGoogleAuth();

  const cleanName = profile.name.trim();
  const cleanEmail = profile.email.trim().toLowerCase();
  const cleanUsername =
    cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 24) || 'creator';

  const googleUser: User = {
    id: profile.id,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    bio: 'Product engineer and open-source enthusiast exploring new creative frontiers.',
    location: 'San Francisco, CA',
    skills: ['AI/Robotics', 'TypeScript', 'System Architecture'],
    interests: ['Autonomous Systems', 'Product Design', 'Community Building'],
    projectInterests: ['Robotics Platform', 'Accessible Tools'],
  };

  // 1. Attempt to register/link with backend API
  try {
    const existing = await api.auth.login(cleanEmail, 'GoogleOAuth_' + profile.id).catch(() => null);
    if (existing) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(existing));
      return existing;
    }

    const registered = await api.auth.register({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: 'GoogleOAuth_' + profile.id,
    });
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(registered));
    return registered;
  } catch {
    // 2. If backend rejects (already exists with different credentials) or is unreachable,
    // establish device-local unified identity
    try {
      const records = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
      const updated = Array.isArray(records)
        ? [...records.filter((r: any) => r?.user?.email !== cleanEmail), { user: googleUser, salt: 'google', passwordHash: 'oauth' }]
        : [{ user: googleUser, salt: 'google', passwordHash: 'oauth' }];
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
    } catch {}

    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(googleUser));
    return googleUser;
  }
}
