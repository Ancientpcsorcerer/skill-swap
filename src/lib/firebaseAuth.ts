import type { User } from '../app/data/models';
import { api } from './api';

const ACTIVE_USER_KEY = 'skill-swap.active-user.v1';
const ACTIVE_ACCOUNT_KEY = 'skill-swap.active-account.v1';
const ACCOUNTS_KEY = 'skill-swap.accounts.v1';

export interface RealProviderProfile {
  provider: 'google' | 'github';
  uid: string;
  displayName: string;
  email: string;
  avatar_url?: string | null;
}

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

function getFirebaseConfig(): FirebaseConfig | null {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const apiKey = env?.VITE_FIREBASE_API_KEY || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.apiKey);
  if (!apiKey) {
    try {
      const stored = localStorage.getItem('skill-swap.firebase-config');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  }
  return {
    apiKey,
    authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.authDomain),
    projectId: env?.VITE_FIREBASE_PROJECT_ID || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.projectId),
    storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env?.VITE_FIREBASE_APP_ID,
  };
}

const loadCdnModule = (url: string): Promise<any> => {
  const dynamicImport = new Function('specifier', 'return import(specifier)');
  return dynamicImport(url);
};

/**
 * Initiates Google OAuth authentication using Firebase Google Authentication.
 * Derives the identity strictly from the authenticated Firebase / Google provider.
 * Throws on cancellation or failure. NEVER returns mock or demo data.
 */
export async function performGoogleAuth(): Promise<RealProviderProfile> {
  const fbConfig = getFirebaseConfig();

  // 1. Official Firebase Web SDK integration (loads dynamically from Google CDN)
  if (fbConfig?.apiKey) {
    try {
      const { initializeApp, getApps } = await loadCdnModule(
        'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'
      );
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await loadCdnModule(
        'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
      );

      const app = getApps().length > 0 ? getApps()[0] : initializeApp(fbConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        throw new Error('No user identity returned by Google authentication.');
      }

      return {
        provider: 'google',
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
        email: user.email || `${user.uid}@gmail.com`,
        avatar_url: user.photoURL || null,
      };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('Google sign-in was cancelled.');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in pop-up was blocked. Please allow pop-ups for this site.');
      }
      if (err?.code === 'auth/unauthorized-domain') {
        throw new Error(
          `This domain (${window.location.hostname}) is not authorized in Firebase. In Firebase Console, go to Authentication > Settings > Authorized domains, and add "${window.location.hostname}".`
        );
      }
      if (err?.code?.startsWith('auth/')) {
        throw new Error(err.message || `Firebase Google Auth error: ${err.code}`);
      }
      throw new Error(err?.message || 'Google authentication failed.');
    }
  }

  // 2. Direct Google OAuth 2.0 Web Popup (when VITE_GOOGLE_CLIENT_ID is configured)
  const googleClientId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    (typeof window !== 'undefined' && (window as any).__GOOGLE_CLIENT_ID__);

  if (googleClientId && typeof window !== 'undefined') {
    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 620;
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
        reject(new Error('Google sign-in pop-up was blocked. Please allow pop-ups for this site.'));
        return;
      }

      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (pollTimer) clearInterval(pollTimer);
        window.removeEventListener('message', messageListener);
      };

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.accessToken) {
          cleanup();
          try { popup.close(); } catch {}
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${event.data.accessToken}` },
            });
            const info = await userInfoRes.json();
            resolve({
              provider: 'google',
              uid: info.sub || info.id,
              displayName: info.name || info.given_name || 'Google User',
              email: info.email,
              avatar_url: info.picture || null,
            });
          } catch {
            reject(new Error('Failed to retrieve user profile from Google.'));
          }
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

  // 3. Neither Firebase config nor Google Client ID is configured
  throw new Error(
    'Google Authentication is not configured. Please configure Firebase Google Authentication or set VITE_GOOGLE_CLIENT_ID.'
  );
}

/**
 * Initiates GitHub authentication using Firebase / GitHub OAuth / token.
 * Derives the identity strictly from the authenticated GitHub user.
 * Throws on cancellation or failure. NEVER returns mock or demo data.
 */
export async function performGitHubAuth(): Promise<RealProviderProfile> {
  const fbConfig = getFirebaseConfig();

  // 1. Firebase GithubAuthProvider
  if (fbConfig?.apiKey) {
    try {
      const { initializeApp, getApps } = await loadCdnModule(
        'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'
      );
      const { getAuth, GithubAuthProvider, signInWithPopup } = await loadCdnModule(
        'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
      );

      const app = getApps().length > 0 ? getApps()[0] : initializeApp(fbConfig);
      const auth = getAuth(app);
      const provider = new GithubAuthProvider();
      provider.addScope('read:user');
      provider.addScope('user:email');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        throw new Error('No user identity returned by GitHub authentication.');
      }

      return {
        provider: 'github',
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'GitHub User',
        email: user.email || `${user.uid}@users.noreply.github.com`,
        avatar_url: user.photoURL || null,
      };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('GitHub sign-in was cancelled.');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('GitHub sign-in pop-up was blocked. Please allow pop-ups for this site.');
      }
      if (err?.code === 'auth/operation-not-allowed') {
        throw new Error(
          'GitHub sign-in is not enabled in your Firebase console. Please go to Firebase Console > Authentication > Sign-in method > GitHub and enable it.'
        );
      }
      if (err?.code === 'auth/unauthorized-domain') {
        throw new Error(
          'This domain is not authorized in Firebase. In Firebase Console, go to Authentication > Settings > Authorized domains, and add "127.0.0.1" and "localhost".'
        );
      }
      if (err?.code?.startsWith('auth/')) {
        throw new Error(err.message || `Firebase GitHub Auth error: ${err.code}`);
      }
      // If Firebase doesn't have GitHub enabled, continue to direct GitHub authentication
    }
  }

  // 2. Direct GitHub OAuth 2.0 Web Popup (when VITE_GITHUB_CLIENT_ID is configured)
  const githubClientId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_CLIENT_ID) ||
    (typeof window !== 'undefined' && (window as any).__GITHUB_CLIENT_ID__);

  if (githubClientId && typeof window !== 'undefined') {
    return new Promise((resolve, reject) => {
      const width = 520;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const redirectUri = window.location.origin + '/auth/github/callback';
      const authUrl =
        `https://github.com/login/oauth/authorize?` +
        `client_id=${encodeURIComponent(githubClientId)}` +
        `&scope=read:user%20user:email` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const popup = window.open(
        authUrl,
        'github_auth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popup || popup.closed) {
        reject(new Error('GitHub sign-in pop-up was blocked. Please allow pop-ups for this site.'));
        return;
      }

      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (pollTimer) clearInterval(pollTimer);
        window.removeEventListener('message', messageListener);
      };

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GITHUB_AUTH_SUCCESS' && event.data.accessToken) {
          cleanup();
          try { popup.close(); } catch {}
          try {
            const userRes = await fetch('https://api.github.com/user', {
              headers: {
                Authorization: `Bearer ${event.data.accessToken}`,
                'User-Agent': 'Skill-Swap',
              },
            });
            const data = await userRes.json();
            resolve({
              provider: 'github',
              uid: String(data.id),
              displayName: data.name || data.login || 'GitHub User',
              email: data.email || `${data.login}@users.noreply.github.com`,
              avatar_url: data.avatar_url || null,
            });
          } catch {
            reject(new Error('Failed to retrieve user profile from GitHub.'));
          }
        } else if (event.data?.type === 'GITHUB_AUTH_ERROR') {
          cleanup();
          try { popup.close(); } catch {}
          reject(new Error(event.data.error || 'GitHub authentication failed.'));
        }
      };

      window.addEventListener('message', messageListener);

      pollTimer = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('GitHub sign-in was cancelled.'));
        }
      }, 600);
    });
  }

  // 3. Configured or stored GitHub token
  const githubToken =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_TOKEN) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('skill-swap.github.token'));

  if (githubToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'User-Agent': 'Skill-Swap',
        },
      });
      if (userRes.ok) {
        const data = await userRes.json();
        return {
          provider: 'github',
          uid: String(data.id),
          displayName: data.name || data.login || 'GitHub User',
          email: data.email || `${data.login}@users.noreply.github.com`,
          avatar_url: data.avatar_url || null,
        };
      }
    } catch {}
  }

  // 4. Neither configured
  throw new Error(
    'GitHub Authentication is not configured. Please configure GitHub provider in Firebase or set VITE_GITHUB_CLIENT_ID.'
  );
}

/**
 * Links the authenticated provider identity with the Skill Swap user model, backend API,
 * and local application session. Strictly isolates account data.
 */
export async function linkAndEstablishUser(profile: RealProviderProfile): Promise<User> {
  const cleanName = profile.displayName.trim();
  const cleanEmail = profile.email.trim().toLowerCase();
  const cleanUsername =
    profile.displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24) ||
    cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 24) ||
    'creator';

  const providerUserId = `usr_${profile.provider}_${profile.uid}`;

  // Check if an existing account exists on this device for this provider identity or email
  let existingUser: User | null = null;
  try {
    const rawAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
    if (Array.isArray(rawAccounts)) {
      const match = rawAccounts.find(
        (a: any) =>
          a?.user?.id === providerUserId ||
          (a?.user?.email && a.user.email.toLowerCase() === cleanEmail)
      );
      if (match?.user) {
        existingUser = match.user;
      }
    }
  } catch {}

  let user: User;
  if (existingUser) {
    // Restore existing user account while updating name/email from the provider
    user = {
      ...existingUser,
      name: cleanName || existingUser.name,
      email: cleanEmail || existingUser.email,
      username: existingUser.username || cleanUsername,
    };
  } else {
    // Create a new user record strictly derived from the real provider identity
    user = {
      id: providerUserId,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      bio: '',
      location: '',
      skills: [],
      interests: [],
      projectInterests: [],
    };
  }

  // Attempt to link/register with the backend PostgreSQL database
  const oauthPassword = `OAuth_${profile.provider}_${profile.uid}_Secret`;
  try {
    const loggedIn = await api.auth.login(cleanEmail, oauthPassword).catch(() => null);
    if (loggedIn) {
      user = {
        ...user,
        id: loggedIn.id,
        name: loggedIn.name || user.name,
        username: loggedIn.username || user.username,
        bio: loggedIn.bio || user.bio,
        location: loggedIn.location || user.location,
        skills: loggedIn.skills?.length ? loggedIn.skills : user.skills,
        interests: loggedIn.interests?.length ? loggedIn.interests : user.interests,
        projectInterests: loggedIn.projectInterests?.length ? loggedIn.projectInterests : user.projectInterests,
      };
    } else {
      const registered = await api.auth
        .register({
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password: oauthPassword,
        })
        .catch(() => null);
      if (registered) {
        user = {
          ...user,
          id: registered.id,
          name: registered.name,
          username: registered.username,
        };
      }
    }
  } catch {
    // If backend is unreachable, continue with device-local persistence
  }

  // Save to local device account store
  try {
    const rawAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
    const filtered = Array.isArray(rawAccounts)
      ? rawAccounts.filter((a: any) => a?.user?.id !== user.id && a?.user?.email !== cleanEmail)
      : [];
    filtered.push({ user, salt: profile.provider, passwordHash: 'oauth' });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch {}

  localStorage.setItem(ACTIVE_ACCOUNT_KEY, user.id);
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));

  return user;
}

/**
 * Public authentication method for Google sign-in.
 */
export async function authenticateWithGoogle(): Promise<User> {
  const profile = await performGoogleAuth();
  return await linkAndEstablishUser(profile);
}

/**
 * Public authentication method for GitHub sign-in.
 */
export async function authenticateWithGitHub(): Promise<User> {
  const profile = await performGitHubAuth();
  return await linkAndEstablishUser(profile);
}
