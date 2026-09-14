import { useSyncExternalStore } from 'react';
export const moduleIds = ['connect', 'create', 'discover', 'learn', 'chat', 'profile'] as const;
export type ModuleId = typeof moduleIds[number];
export type Destination = ModuleId | 'signup' | 'login';
const navigationEvent = 'skill-swap:navigate';
function subscribe(callback: () => void) {
  addEventListener('hashchange', callback);
  addEventListener('popstate', callback);
  addEventListener(navigationEvent, callback);
  return () => {
    removeEventListener('hashchange', callback);
    removeEventListener('popstate', callback);
    removeEventListener(navigationEvent, callback);
  };
}
export function useApplicationRoute() {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  const [path, query] = hash.slice(2).split('?');
  const candidate = path?.replace('app/', '') as ModuleId;
  const searchParams = new URLSearchParams(query || '');
  const next = searchParams.get('next') as ModuleId | null;
  const user = searchParams.get('user');
  return {
    view: path === 'signup' || path === 'login' ? path : hash.startsWith('#/app') ? moduleIds.includes(candidate) ? candidate : 'connect' : null,
    next: next && moduleIds.includes(next) ? next : null,
    user,
    query: searchParams,
  };
}
export function navigate(destination: Destination | null, next?: ModuleId, replace = false, extraParams?: Record<string, string>) {
  let queryString = next ? 'next=' + next : '';
  if (extraParams) {
    const sp = new URLSearchParams(queryString);
    for (const [k, v] of Object.entries(extraParams)) {
      sp.set(k, v);
    }
    queryString = sp.toString();
  }
  const hash = destination ? '#/' + (moduleIds.includes(destination as ModuleId) ? 'app/' : '') + destination + (queryString ? '?' + queryString : '') : '';
  if (location.hash === hash) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', location.pathname + location.search + hash);
  dispatchEvent(new Event(navigationEvent));
}
