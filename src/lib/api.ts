import type {
  User,
  Project,
  ProjectUpdate,
  PostItem,
  LearningRecord,
  Community,
  ExplorationItem,
  Activity,
  TeachingProfile,
  TeachingRequest,
  ClassItem,
  StudentItem,
  ClassSession,
  ZoomStatus,
  CommentItem,
  ChatMessage,
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

export interface TrendingTopicItem {
  id: string;
  name: string;
  category: string;
  count: number;
  type: 'skill' | 'tag' | 'community' | 'project';
  query: string;
}

export interface TrendingResponse {
  topics: TrendingTopicItem[];
  topSkills: { skill: string; count: number }[];
  popularCommunities: Community[];
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

    async oauth(input: {
      email: string;
      name: string;
      username?: string;
      avatarUrl?: string | null;
      provider: string;
      providerUid?: string;
    }) {
      const res = await request<{ user: User; accessToken: string }>('/auth/oauth', {
        method: 'POST',
        body: JSON.stringify(input),
        skipAuth: true,
      });
      setApiToken(res.accessToken);
      return res;
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

    async updatePhoto(avatarUrl: string): Promise<User> {
      const res = await request<{ profile: User }>('/profile/photo', {
        method: 'POST',
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      return res.profile;
    },

    async removePhoto(): Promise<User> {
      const res = await request<{ profile: User }>('/profile/photo', {
        method: 'DELETE',
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

    async setCoverImage(id: string, coverImageUrl: string) {
      const res = await request<{ project: Project }>(`/projects/${id}/cover`, {
        method: 'POST',
        body: JSON.stringify({ cover_image_url: coverImageUrl }),
      });
      return res.project;
    },

    async updateVisibility(id: string, visibility: 'public' | 'private') {
      const res = await request<{ project: Project }>(`/projects/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ visibility }),
      });
      return res.project;
    },

    async follow(id: string) {
      return request(`/projects/${id}/follow`, { method: 'POST' });
    },

    async unfollow(id: string) {
      return request(`/projects/${id}/follow`, { method: 'DELETE' });
    },

    async join(id: string) {
      return request(`/projects/${id}/join`, { method: 'POST' });
    },

    async recreate(id: string) {
      const res = await request<{ project: Project }>(`/projects/${id}/recreate`, {
        method: 'POST',
      });
      return res.project;
    },

    async getUpdates(id: string) {
      const res = await request<{ updates: ProjectUpdate[] }>(`/projects/${id}/updates`);
      return res.updates;
    },

    async addUpdate(id: string, data: { title: string; body: string; image_urls?: string[]; video_urls?: string[] }) {
      const res = await request<{ update: ProjectUpdate }>(`/projects/${id}/updates`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.update;
    },

    async like(id: string) {
      return request<{ success: boolean; likeCount: number; hasLiked: boolean }>(`/projects/${id}/like`, { method: 'POST' });
    },

    async unlike(id: string) {
      return request<{ success: boolean; likeCount: number; hasLiked: boolean }>(`/projects/${id}/like`, { method: 'DELETE' });
    },

    async repost(id: string) {
      return request<{ success: boolean; repostCount: number; hasReposted: boolean }>(`/projects/${id}/repost`, { method: 'POST' });
    },

    async unrepost(id: string) {
      return request<{ success: boolean; repostCount: number; hasReposted: boolean }>(`/projects/${id}/repost`, { method: 'DELETE' });
    },

    async report(id: string, reason: string) {
      return request<{ success: boolean; reportId: string }>(`/projects/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  },

  chat: {
    async getConversations() {
      const res = await request<{ conversations: any[] }>('/chat/conversations');
      return res.conversations;
    },

    async getOrCreateConversation(partnerId: string) {
      const res = await request<{ conversation: { id: string; partner: any; updated_at: string } }>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ partnerId }),
      });
      return res.conversation;
    },

    async getClassConversation(classId: string) {
      const res = await request<{ conversation: any }>(`/chat/conversations/class/${classId}`);
      return res.conversation;
    },

    async getMessages(conversationId: string) {
      const res = await request<{ messages: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`);
      return res.messages;
    },

    async sendMessage(
      conversationId: string,
      payload: {
        ciphertext: string;
        iv: string;
        authTag: string;
        ratchetHeader?: Record<string, unknown>;
        reply_to_message_id?: string | null;
      }
    ) {
      const res = await request<{ message: ChatMessage }>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.message;
    },

    async editMessage(
      messageId: string,
      payload: {
        ciphertext: string;
        iv: string;
        authTag: string;
        ratchetHeader?: Record<string, unknown>;
      }
    ) {
      const res = await request<{ message: ChatMessage }>(`/chat/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.message;
    },

    async deleteMessage(messageId: string) {
      const res = await request<{ message: ChatMessage }>(`/chat/messages/${messageId}`, {
        method: 'DELETE',
      });
      return res.message;
    },

    async forwardMessage(
      messageId: string,
      payload: {
        targetConversationId: string;
        ciphertext?: string;
        iv?: string;
        authTag?: string;
        ratchetHeader?: Record<string, unknown>;
      }
    ) {
      const res = await request<{ message: ChatMessage }>(`/chat/messages/${messageId}/forward`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.message;
    },
  },

  comments: {
    async list(targetType: 'post' | 'project', targetId: string) {
      const res = await request<{ comments: CommentItem[]; total_count: number }>(
        `/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
      );
      return res;
    },

    async create(data: {
      targetType: 'post' | 'project';
      targetId: string;
      body: string;
      parentCommentId?: string | null;
    }) {
      const res = await request<{ comment: CommentItem }>('/comments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.comment;
    },

    async update(id: string, body: string) {
      const res = await request<{ comment: CommentItem }>(`/comments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ body }),
      });
      return res.comment;
    },

    async delete(id: string) {
      const res = await request<{ success: boolean; comment: CommentItem }>(`/comments/${id}`, {
        method: 'DELETE',
      });
      return res;
    },

    async like(id: string) {
      return request<{ success: boolean; like_count: number; has_liked: boolean }>(`/comments/${id}/like`, {
        method: 'POST',
      });
    },

    async unlike(id: string) {
      return request<{ success: boolean; like_count: number; has_liked: boolean }>(`/comments/${id}/like`, {
        method: 'DELETE',
      });
    },

    async report(id: string, reason: string) {
      return request<{ success: boolean; report_id: string }>(`/comments/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  },

  crypto: {
    async registerKeys(data: { identityPublicKey: string; signedPrekey: string; signedPrekeySignature: string; oneTimePrekeys?: Array<{ keyId: string; publicKey: string }> }) {
      return request('/crypto/prekeys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getPrekeyBundle(userId: string) {
      const res = await request<{ bundle: any }>(`/crypto/prekey-bundle/${userId}`);
      return res.bundle;
    },
  },

  media: {
    async upload(data: { filename: string; mimeType: string; base64Data: string; isPrivate?: boolean; projectId?: string }) {
      const res = await request<{ media: { id: string; url: string; media_type: 'image' | 'video'; mime_type: string; size_bytes: number } }>('/media/upload', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.media;
    },
  },

  posts: {
    async list(authorId?: string) {
      const url = authorId ? `/posts?authorId=${encodeURIComponent(authorId)}` : '/posts';
      const res = await request<{ posts: PostItem[] }>(url);
      return res.posts;
    },

    async getById(id: string) {
      const res = await request<{ post: PostItem }>(`/posts/${id}`);
      return res.post;
    },

    async create(data: { title: string; content: string; tags?: string[]; project_tag?: string; art?: string; image_urls?: string[]; video_urls?: string[] }) {
      const res = await request<{ post: PostItem }>('/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.post;
    },

    async update(id: string, data: { title?: string; content?: string; tags?: string[]; project_tag?: string; art?: string; image_urls?: string[]; video_urls?: string[] }) {
      const res = await request<{ post: PostItem }>(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.post;
    },

    async delete(id: string) {
      return request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' });
    },

    async like(id: string) {
      return request<{ success: boolean; likeCount: number; hasLiked: boolean }>(`/posts/${id}/like`, { method: 'POST' });
    },

    async unlike(id: string) {
      return request<{ success: boolean; likeCount: number; hasLiked: boolean }>(`/posts/${id}/like`, { method: 'DELETE' });
    },

    async save(id: string) {
      return request<{ success: boolean; hasSaved: boolean }>(`/posts/${id}/save`, { method: 'POST' });
    },

    async unsave(id: string) {
      return request<{ success: boolean; hasSaved: boolean }>(`/posts/${id}/save`, { method: 'DELETE' });
    },

    async report(id: string, reason: string) {
      return request<{ success: boolean; reportId: string }>(`/posts/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    async repost(id: string) {
      return request<{ success: boolean; repostCount: number; hasReposted: boolean }>(`/posts/${id}/repost`, {
        method: 'POST',
      });
    },

    async unrepost(id: string) {
      return request<{ success: boolean; repostCount: number; hasReposted: boolean }>(`/posts/${id}/repost`, {
        method: 'DELETE',
      });
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

  teaching: {
    async getProfile() {
      const res = await request<{ profile: TeachingProfile }>('/teaching/profile');
      return res.profile;
    },

    async updateProfile(data: { headline?: string; bio?: string; hourly_rate?: string; status?: 'available' | 'busy' | 'paused'; availability_slots?: Array<{ day: string; time: string }>; skills?: string[] }) {
      const res = await request<{ profile: TeachingProfile }>('/teaching/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.profile;
    },

    async listTeachers(skill?: string) {
      const url = skill ? `/teaching/teachers?skill=${encodeURIComponent(skill)}` : '/teaching/teachers';
      const res = await request<{ teachers: TeachingProfile[] }>(url);
      return res.teachers;
    },

    async getRequests() {
      const res = await request<{ incoming: TeachingRequest[]; outgoing: TeachingRequest[] }>('/teaching/requests');
      return res;
    },

    async sendRequest(teacherId: string, skill: string, message: string) {
      const res = await request<{ request: TeachingRequest }>('/teaching/requests', {
        method: 'POST',
        body: JSON.stringify({ teacherId, skill, message }),
      });
      return res.request;
    },

    async acceptRequest(id: string) {
      const res = await request<{ request: TeachingRequest }>(`/teaching/requests/${id}/accept`, {
        method: 'POST',
      });
      return res.request;
    },

    async declineRequest(id: string) {
      const res = await request<{ request: TeachingRequest }>(`/teaching/requests/${id}/decline`, {
        method: 'POST',
      });
      return res.request;
    },

    async getStudents() {
      const res = await request<{ students: StudentItem[] }>('/teaching/students');
      return res.students;
    },

    async getClasses() {
      const res = await request<{ classes: ClassItem[] }>('/teaching/classes');
      return res.classes;
    },

    async createClass(data: { title: string; description: string; skill: string; schedule?: string; meeting_url?: string; max_students?: number }) {
      const res = await request<{ class: ClassItem }>('/teaching/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.class;
    },

    async joinClass(id: string) {
      return request<{ success: boolean; memberCount: number }>(`/teaching/classes/${id}/join`, {
        method: 'POST',
      });
    },

    async leaveClass(id: string) {
      return request<{ success: boolean; memberCount: number }>(`/teaching/classes/${id}/leave`, {
        method: 'POST',
      });
    },

    async getSessions(trackId?: string) {
      const url = trackId ? `/teaching/sessions?trackId=${encodeURIComponent(trackId)}` : '/teaching/sessions';
      const res = await request<{ sessions: ClassSession[] }>(url);
      return res.sessions;
    },

    async createSession(data: {
      class_id?: string;
      student_id?: string;
      track_id?: string;
      title: string;
      scheduled_at: string;
      duration_minutes?: number;
      timezone?: string;
      teacher_info?: string;
      meeting_url?: string;
      require_zoom?: boolean;
    }) {
      const res = await request<{ session: ClassSession }>('/teaching/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.session;
    },

    async updateSession(
      id: string,
      data: {
        title?: string;
        scheduled_at?: string;
        duration_minutes?: number;
        timezone?: string;
        teacher_info?: string;
      }
    ) {
      const res = await request<{ session: ClassSession }>(`/teaching/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.session;
    },

    async cancelSession(id: string) {
      const res = await request<{ session: ClassSession }>(`/teaching/sessions/${id}/cancel`, {
        method: 'POST',
      });
      return res.session;
    },

    async getZoomStatus(): Promise<ZoomStatus> {
      const res = await request<ZoomStatus>('/teaching/zoom/status');
      return res;
    },

    async getZoomAuthorizeUrl(): Promise<string> {
      const res = await request<{ url: string }>('/teaching/zoom/authorize');
      return res.url;
    },

    async disconnectZoom(): Promise<void> {
      await request('/teaching/zoom/disconnect', { method: 'POST' });
    },
  },

  discover: {
    async getTrending(): Promise<TrendingResponse> {
      const res = await request<TrendingResponse>('/trending');
      return res;
    },

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

export const apiClient = api;
