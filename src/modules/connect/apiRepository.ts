import { api } from '../../lib/api';
import { createLocalConnectRepository, type ConnectRepository } from './repository';
import type { ConnectionRequest, Person } from './types';

export function createApiConnectRepository(userId?: string): ConnectRepository {
  const localRepo = createLocalConnectRepository(userId);

  return {
    async listPeople(): Promise<Person[]> {
      try {
        const data = await api.users.search({ limit: 50 });
        if (data && data.users && data.users.length > 0) {
          return data.users.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            skills: u.skills || [],
            interests: u.interests || [],
            projectInterests: u.projectInterests || [],
            description: u.bio || 'Skill Swap collaborator',
          }));
        }
      } catch {
        // Fallback to local
      }
      return localRepo.listPeople();
    },

    async listRequests(): Promise<ConnectionRequest[]> {
      try {
        const raw = await api.connections.list();
        if (Array.isArray(raw)) {
          return raw.map((c: any) => ({
            id: c.id,
            personId: c.partner?.id || (c.requester_id === userId ? c.addressee_id : c.requester_id),
            direction: c.requester_id === userId ? 'outgoing' : 'incoming',
            status: c.status,
          }));
        }
      } catch {
        // Fallback to local
      }
      return localRepo.listRequests();
    },

    async sendRequest(personId: string): Promise<ConnectionRequest> {
      try {
        const conn = (await api.connections.sendRequest(personId)) as any;
        return {
          id: conn?.id || `outgoing-${personId}`,
          personId,
          direction: 'outgoing',
          status: 'pending',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          return localRepo.sendRequest(personId);
        }
        throw err;
      }
    },

    async respondToRequest(id: string, response: 'accepted' | 'declined'): Promise<ConnectionRequest> {
      try {
        if (response === 'accepted') {
          await api.connections.accept(id);
        } else {
          await api.connections.decline(id);
        }
        return {
          id,
          personId: '',
          direction: 'incoming',
          status: response,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          return localRepo.respondToRequest(id, response);
        }
        throw err;
      }
    },
  };
}
