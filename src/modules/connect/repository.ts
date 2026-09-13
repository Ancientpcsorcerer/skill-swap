import { connectionRequests, connectPeople } from './data';
import type { ConnectionRequest, Person } from './types';

export interface ConnectRepository {
  listPeople(): Promise<Person[]>;
  listRequests(): Promise<ConnectionRequest[]>;
  sendRequest(personId: string): Promise<ConnectionRequest>;
  respondToRequest(id: string, response: 'accepted' | 'declined'): Promise<ConnectionRequest>;
}
// All persistence lives behind this adapter. A future API can implement the same asynchronous contract.
export function createLocalConnectRepository(userId?: string): ConnectRepository {
  const people = structuredClone(connectPeople);
  const storageKey = userId ? 'skill-swap.connections.v1.' + userId : null;
  let requests = structuredClone(connectionRequests);
  if (storageKey) { try { const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null'); if (Array.isArray(saved)) requests = saved; } catch { /* Keep initial fixtures if storage is unreadable. */ } }
  const save = () => { if (storageKey) localStorage.setItem(storageKey, JSON.stringify(requests)); };
  return {
    async listPeople() { return structuredClone(people); },
    async listRequests() { return structuredClone(requests); },
    async sendRequest(personId) {
      if (!people.some(person => person.id === personId)) throw new Error('This person is no longer available.');
      const existing = requests.find(request => request.personId === personId && request.status !== 'declined');
      if (existing) return { ...existing };
      const request: ConnectionRequest = { id: 'outgoing-' + personId, personId, direction: 'outgoing', status: 'pending' };
      requests.push(request); save(); return { ...request };
    },
    async respondToRequest(id, response) {
      const request = requests.find(item => item.id === id);
      if (!request || request.direction !== 'incoming' || request.status !== 'pending') throw new Error('This request is no longer pending.');
      request.status = response; save(); return { ...request };
    },
  };
}
