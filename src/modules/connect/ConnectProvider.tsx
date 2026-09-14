import { useSession } from '../../app/session/SessionProvider';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { type ConnectRepository } from './repository';
import { createApiConnectRepository } from './apiRepository';
import type { ConnectTab, ConnectionRequest, Person } from './types';
interface State { people: Person[]; requests: ConnectionRequest[]; loading: boolean; error: string; announcement: string }
type Action = { type: 'loaded'; people: Person[]; requests: ConnectionRequest[] } | { type: 'error'; message: string }
  | { type: 'updated'; request: ConnectionRequest; message: string };
function reducer(state: State, action: Action): State {
  if (action.type === 'loaded') return { ...state, people: action.people, requests: action.requests, loading: false, error: '' };
  if (action.type === 'error') return { ...state, loading: false, error: action.message };
  return { ...state, error: '', announcement: action.message, requests: [...state.requests.filter(request => request.id !== action.request.id), action.request] };
}
function useConnectController(repository: ConnectRepository) {
  const [state, dispatch] = useReducer(reducer, { people: [], requests: [], loading: true, error: '', announcement: '' });
  const [tab, setTab] = useState<ConnectTab>('people');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string[]>([]);
  const pending = useRef(new Set<string>());
  const mounted = useRef(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false; mounted.current = true;
    Promise.all([repository.listPeople(), repository.listRequests()]).then(([people, requests]) => {
      if (!cancelled) dispatch({ type: 'loaded', people, requests });
    }).catch(error => { if (!cancelled) dispatch({ type: 'error', message: error instanceof Error ? error.message : 'People could not be loaded.' }); });
    return () => { cancelled = true; mounted.current = false; };
  }, [repository, reload]);
  async function perform(personId: string, operation: () => Promise<ConnectionRequest>, message: string) {
    if (pending.current.has(personId)) return;
    pending.current.add(personId); setBusy([...pending.current]);
    try {
      const request = await operation();
      if (mounted.current) dispatch({ type: 'updated', request, message });
    } catch (error) {
      if (mounted.current) dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Your request could not be updated. Try again.' });
    } finally {
      pending.current.delete(personId);
      if (mounted.current) setBusy([...pending.current]);
    }
  }
  const send = (person: Person) => perform(person.id, () => repository.sendRequest(person.id), 'Request sent to ' + person.name + '.');
  const respond = (request: ConnectionRequest, response: 'accepted' | 'declined') => {
    const name = state.people.find(person => person.id === request.personId)?.name ?? 'this person';
    return perform(request.personId, () => repository.respondToRequest(request.id, response),
      response === 'accepted' ? 'You and ' + name + ' are now connected.' : 'Request from ' + name + ' declined.');
  };
  return { ...state, tab, setTab, query, setQuery, busy, send, respond, retry: () => setReload(value => value + 1) };
}
const ConnectContext = createContext<ReturnType<typeof useConnectController> | null>(null);
export function ConnectProvider({ children, repository: supplied }: { children: ReactNode; repository?: ConnectRepository }) {
  const { session } = useSession();
  const repository = useMemo(() => supplied ?? createApiConnectRepository(session?.identity.id), [supplied, session?.identity.id]);
  const controller = useConnectController(repository);
  return <ConnectContext.Provider value={controller}>{children}</ConnectContext.Provider>;
}
export function useConnect() {
  const context = useContext(ConnectContext);
  if (!context) throw new Error('ConnectProvider is required');
  return context;
}
