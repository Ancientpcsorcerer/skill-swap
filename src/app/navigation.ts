import { useSyncExternalStore } from 'react';
export const moduleIds = ['profile', 'connect', 'create', 'learn', 'discover'] as const;
export type ModuleId = typeof moduleIds[number];
export type Destination = ModuleId | 'signup' | 'login';
const navigationEvent = 'skill-swap:navigate';
function subscribe(callback: () => void) { addEventListener('hashchange', callback); addEventListener('popstate', callback); addEventListener(navigationEvent, callback); return () => { removeEventListener('hashchange', callback); removeEventListener('popstate', callback); removeEventListener(navigationEvent, callback); }; }
export function useApplicationRoute() {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  const [path, query] = hash.slice(2).split('?');
  const candidate = path?.replace('app/', '') as ModuleId;
  const next = new URLSearchParams(query).get('next') as ModuleId | null;
  return { view: path === 'signup' || path === 'login' ? path : hash.startsWith('#/app') ? moduleIds.includes(candidate) ? candidate : 'connect' : null,
    next: next && moduleIds.includes(next) ? next : null };
}
export function navigate(destination: Destination | null, next?: ModuleId, replace = false) {
  const hash = destination ? '#/' + (moduleIds.includes(destination as ModuleId) ? 'app/' : '') + destination + (next ? '?next=' + next : '') : '';
  if (location.hash === hash) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', location.pathname + location.search + hash); dispatchEvent(new Event(navigationEvent));
}
