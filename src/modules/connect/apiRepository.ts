import { api } from '../../lib/api';
import { type ConnectRepository } from './repository';
import type { ConnectionRequest, Person } from './types';

export function createApiConnectRepository(userId?: string): ConnectRepository {
  return {
    async listPeople(): Promise<Person[]> {
      const data = await api.users.search({ limit: 50 });
      if (data && Array.isArray(data.users)) {
        return data.users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          skills: u.skills || [],
          interests: u.interests || [],
          projectInterests: u.projectInterests || [],
          description: u.bio || 'Skill Swap collaborator',
          avatarUrl: u.avatarUrl || u.avatar_url || null,
          avatar_url: u.avatarUrl || u.avatar_url || null,
        }));
      }
      return [];
    },

    async listRequests(): Promise<ConnectionRequest[]> {
      if (!userId) return [];
      const raw = await api.connections.list();
      if (Array.isArray(raw)) {
        return raw.map((c: any) => ({
          id: c.id,
          personId: c.partner?.id || (c.requester_id === userId ? c.addressee_id : c.requester_id),
          direction: c.requester_id === userId ? 'outgoing' : 'incoming',
          status: c.status,
        }));
      }
      return [];
    },

    async sendRequest(personId: string): Promise<ConnectionRequest> {
      const conn = (await api.connections.sendRequest(personId)) as any;
      return {
        id: conn?.id || `outgoing-${personId}`,
        personId,
        direction: 'outgoing',
        status: 'pending',
      };
    },

    async respondToRequest(id: string, response: 'accepted' | 'declined'): Promise<ConnectionRequest> {
      let conn: any;
      if (response === 'accepted') {
        conn = (await api.connections.accept(id)) as any;
      } else {
        conn = (await api.connections.decline(id)) as any;
      }
      return {
        id,
        personId: conn?.requester_id || conn?.partner?.id || '',
        direction: 'incoming',
        status: response,
      };
    },
  };
}
