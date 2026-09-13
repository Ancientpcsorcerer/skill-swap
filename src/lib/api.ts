import type {
  User,
  Project,
  LearningRecord,
  Community,
  ExplorationItem,
  Activity,
} from '../app/data/models';

export const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' &&
   window.location.hostname !== 'localhost' &&
   window.location.hostname !== '127.0.0.1'
    ? 'https://skill-swap-api-0jym.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

let authToken: string | null = null;

export function setApiToken(token: string | null): void {
  authToken = token;
  if (token) {
    try {
      localStorage.setItem('skill-swap.jwt.v1', token);
    } catch {
      // ignore
    }
  } else {
    try {
      localStorage.removeItem('skill-swap.jwt.v1');
    } catch {
      // ignore
    }
  }
}

export function getApiToken(): string | null {
  if (!authToken) {
    try {
      authToken = localStorage.getItem('skill-swap.jwt.v1');
    } catch {
      authToken = null;
    }
  }
  return authToken;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getApiToken();
  if (!options.skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends refresh token cookie
  });

  // Handle 401 Unauthorized token refresh
  if (response.status === 401 && !options.skipAuth && !path.includes('/auth/')) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.data?.accessToken;
        if (newToken) {
          setApiToken(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            throw new Error(retryData?.error?.message || 'Request failed');
          }
          return retryData.data ?? retryData;
        }
      }
    } catch {
      setApiToken(null);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || response.statusText || 'An unexpected error occurred';
    throw new Error(message);
  }

  return (data?.data ?? data) as T;
}

export const api = {
  auth: {
    async register(input: { name: string; username?: string; email: string; password: string }) {
      const username =
        input.username ||
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 30) ||
        'member';
      const res = await request<{ user: User; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...input, username }),
        skipAuth: true,
      });
      setApiToken(res.accessToken);
      return res.user;
    },

    async login(identifier: string, password: string) {
      const res = await request<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
        skipAuth: true,
      });
      setApiToken(res.accessToken);
      return res.user;
    },

    async me() {
      const res = await request<{ user: User }>('/auth/me');
      return res.user;
    },

    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setApiToken(null);
      }
    },
  },

  profile: {
    async get(): Promise<User> {
      const res = await request<{ profile: User }>('/profile');
      return res.profile;
    },

    async update(data: Partial<User>): Promise<User> {
      const res = await request<{ profile: User }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.profile;
    },
  },

  users: {
    async search(params: { q?: string; skill?: string; limit?: number; offset?: number }) {
      const query = new URLSearchParams();
      if (params.q) query.set('q', params.q);
      if (params.skill) query.set('skill', params.skill);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      return request<{ users: User[]; total: number }>(`/users?${query.toString()}`);
    },

    async suggested() {
      const res = await request<{ users: User[] }>('/users/suggested');
      return res.users;
    },

    async getById(id: string) {
      const res = await request<{ user: User }>(`/users/${id}`);
      return res.user;
    },
  },

  connections: {
    async list() {
      const res = await request<{ connections: unknown[] }>('/connections');
      return res.connections;
    },

    async sendRequest(addresseeId: string) {
      const res = await request<{ connection: unknown }>('/connections', {
        method: 'POST',
        body: JSON.stringify({ addresseeId }),
      });
      return res.connection;
    },

    async accept(id: string) {
      const res = await request<{ connection: unknown }>(`/connections/${id}/accept`, {
        method: 'PUT',
      });
      return res.connection;
    },

    async decline(id: string) {
      const res = await request<{ connection: unknown }>(`/connections/${id}/decline`, {
        method: 'PUT',
      });
      return res.connection;
    },

    async remove(id: string) {
      return request(`/connections/${id}`, { method: 'DELETE' });
    },
  },

  projects: {
    async list(params?: { q?: string; tag?: string; type?: string; skill?: string }) {
      const query = new URLSearchParams();
      if (params?.q) query.set('q', params.q);
      if (params?.tag) query.set('tag', params.tag);
      if (params?.type) query.set('type', params.type);
      if (params?.skill) query.set('skill', params.skill);
      const res = await request<{ projects: Project[]; total: number }>(`/projects?${query.toString()}`);
      return res.projects;
    },

    async getById(id: string) {
      const res = await request<{ project: Project }>(`/projects/${id}`);
      return res.project;
    },

    async create(data: {
      title: string;
      description: string;
      vision?: string;
      type: string;
      tags?: string[];
      required_skills?: string[];
      art?: string;
    }) {
      const res = await request<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.project;
    },

    async update(id: string, data: Partial<Project>) {
      const res = await request<{ project: Project }>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.project;
    },

    async delete(id: string) {
      return request(`/projects/${id}`, { method: 'DELETE' });
    },
  },

  learning: {
    async getState() {
      return request<{ records: LearningRecord[]; goals: { id: string; goal: string }[] }>(
        '/learning'
      );
    },

    async updateRecord(pathId: string, status: 'In Progress' | 'Saved' | 'Completed', progress: number) {
      const res = await request<{ record: LearningRecord }>(`/learning/records/${pathId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, progress }),
      });
      return res.record;
    },

    async addGoal(goal: string) {
      const res = await request<{ goal: { id: string; goal: string } }>('/learning/goals', {
        method: 'POST',
        body: JSON.stringify({ goal }),
      });
      return res.goal;
    },

    async deleteGoal(id: string) {
      return request(`/learning/goals/${id}`, { method: 'DELETE' });
    },
  },

  discover: {
    async getCommunities() {
      const res = await request<{ communities: Community[] }>('/communities');
      return res.communities;
    },

    async joinCommunity(id: string) {
      return request(`/communities/${id}/join`, { method: 'POST' });
    },

    async leaveCommunity(id: string) {
      return request(`/communities/${id}/leave`, { method: 'DELETE' });
    },

    async getIdeas() {
      const res = await request<{ ideas: ExplorationItem[] }>('/ideas');
      return res.ideas;
    },

    async getEvents() {
      const res = await request<{ events: ExplorationItem[] }>('/events');
      return res.events;
    },

    async getSaved() {
      const res = await request<{ items: { item_type: string; item_id: string }[] }>('/saved');
      return res.items;
    },

    async save(itemType: 'project' | 'idea' | 'event', itemId: string) {
      const res = await request<{ item: unknown }>('/saved', {
        method: 'POST',
        body: JSON.stringify({ itemType, itemId }),
      });
      return res.item;
    },

    async unsave(itemType: 'project' | 'idea' | 'event', itemId: string) {
      return request(`/saved/${itemType}/${itemId}`, { method: 'DELETE' });
    },

    async getActivity() {
      const res = await request<{ activity: Activity[] }>('/activity');
      return res.activity;
    },
  },
};
