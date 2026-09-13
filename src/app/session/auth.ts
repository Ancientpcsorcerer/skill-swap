import type { User } from '../data/models';
export interface Credentials { name: string; email: string; password: string }
interface Account { user: User; salt: string; passwordHash: string }
export interface AuthProvider { restore(): User | null; signUp(input: Credentials): Promise<User>; login(email: string, password: string): Promise<User>; logout(): void; update(user: User): User }
const accountsKey = 'skill-swap.accounts.v1';
const activeKey = 'skill-swap.active-account.v1';
function accounts(): Account[] {
  try { const data: unknown = JSON.parse(localStorage.getItem(accountsKey) ?? '[]'); return Array.isArray(data) ? data.filter(item => item?.user?.id && item?.user?.email && item?.salt && item?.passwordHash) : []; } catch { return []; }
}
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = Uint8Array.from(salt.match(/.{2}/g)!, value => parseInt(value, 16));
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 150000, salt: bytes }, key, 256)));
}
function persist(records: Account[], user: User) {
  try { localStorage.setItem(accountsKey, JSON.stringify(records)); localStorage.setItem(activeKey, user.id); }
  catch { throw new Error('Your browser could not save this account. Allow site storage and try again.'); }
  return user;
}
// Device-local identity provider for this UI milestone. No server authentication is claimed.
export const localAuth: AuthProvider = {
  restore() { try { const id = localStorage.getItem(activeKey); return accounts().find(account => account.user.id === id)?.user ?? null; } catch { return null; } },
  async signUp({ name, email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    if (name.trim().length < 2) throw new Error('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
    const records = accounts();
    if (records.some(account => account.user.email === cleanEmail)) throw new Error('An account with this email already exists on this device. Log in instead.');
    const user: User = { id: crypto.randomUUID(), name: name.trim(), username: (name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0,30).padEnd(2,'_') || 'member'), email: cleanEmail, bio: '', location: '', skills: [], interests: [], projectInterests: [] };
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await passwordHash(password, salt);
    return persist([...records, { user, salt, passwordHash: hash }], user);
  },
  async login(email, password) {
    const account = accounts().find(record => record.user.email === email.trim().toLowerCase());
    if (!account || await passwordHash(password, account.salt) !== account.passwordHash) throw new Error('The email or password does not match an account on this device.');
    return persist(accounts(), account.user);
  },
  logout() { localStorage.removeItem(activeKey); },
  update(user) { const records = accounts(); const account = records.find(record => record.user.id === user.id); if (!account) throw new Error('Please log in again.'); account.user = user; return persist(records, user); },
};
