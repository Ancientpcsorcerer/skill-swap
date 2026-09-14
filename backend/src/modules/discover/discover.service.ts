import { query, queryOne, withTransaction } from '../../db/client';
import { NotFoundError } from '../../utils/errors';

export interface CommunityRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  art: string;
  member_count: number;
  created_at: string;
  is_member?: boolean;
}

export interface IdeaRecord {
  id: string;
  author_id: string | null;
  title: string;
  description: string;
  tags: string[];
  art: string;
  created_at: string;
  author_name?: string;
}

export interface EventRecord {
  id: string;
  organizer_id: string | null;
  title: string;
  description: string;
  tags: string[];
  art: string;
  event_date: string | null;
  location: string | null;
  is_online: boolean;
  created_at: string;
  organizer_name?: string;
}

export interface SavedItemRecord {
  id: string;
  user_id: string;
  item_type: 'project' | 'idea' | 'event';
  item_id: string;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  user_id: string;
  kind: 'project' | 'learning' | 'profile' | 'connection';
  title: string;
  description: string;
  reference_id: string | null;
  created_at: string;
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
  popularCommunities: CommunityRecord[];
}

export class DiscoverService {
  async getTrending(userId?: string): Promise<TrendingResponse> {
    // 1. Top skills by active practitioner count
    const skillsRows = await query<{ skill: string; count: string }>(
      `SELECT skill, COUNT(DISTINCT user_id)::text as count
       FROM user_skills
       GROUP BY skill
       ORDER BY COUNT(DISTINCT user_id) DESC, skill ASC
       LIMIT 6`
    );

    // 2. Top project tags
    const tagsRows = await query<{ tag: string; count: string }>(
      `SELECT tag, COUNT(DISTINCT project_id)::text as count
       FROM project_tags
       GROUP BY tag
       ORDER BY COUNT(DISTINCT project_id) DESC, tag ASC
       LIMIT 6`
    );

    // 3. Top communities
    const communities = await this.getCommunities(userId);

    // Build unified topics array
    const topics: TrendingTopicItem[] = [];

    for (const row of skillsRows) {
      topics.push({
        id: `skill-${row.skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: row.skill,
        category: 'Skill',
        count: parseInt(row.count, 10) || 0,
        type: 'skill',
        query: row.skill,
      });
    }

    for (const row of tagsRows) {
      if (!topics.some((t) => t.name.toLowerCase() === row.tag.toLowerCase())) {
        topics.push({
          id: `tag-${row.tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: row.tag,
          category: 'Topic',
          count: parseInt(row.count, 10) || 0,
          type: 'tag',
          query: row.tag,
        });
      }
    }

    // Sort topics by count descending
    topics.sort((a, b) => b.count - a.count);

    return {
      topics: topics.slice(0, 8),
      topSkills: skillsRows.map((r) => ({ skill: r.skill, count: parseInt(r.count, 10) || 0 })),
      popularCommunities: communities.slice(0, 5),
    };
  }

  async getCommunities(userId?: string): Promise<CommunityRecord[]> {
    const rows = await query<CommunityRecord & { is_member: boolean }>(
      `SELECT c.id, c.name, c.description, c.category, c.art, c.member_count, c.created_at,
              CASE WHEN cm.user_id IS NOT NULL THEN true ELSE false END as is_member
       FROM communities c
       LEFT JOIN community_memberships cm ON cm.community_id = c.id AND cm.user_id = $1
       ORDER BY c.member_count DESC, c.name ASC`,
      [userId ?? null]
    );
    return rows;
  }

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    const comm = await queryOne<{ id: string }>(`SELECT id FROM communities WHERE id = $1`, [
      communityId,
    ]);
    if (!comm) {
      throw new NotFoundError('Community not found');
    }

    await withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO community_memberships (community_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (community_id, user_id) DO NOTHING`,
        [communityId, userId]
      );

      if (res.rowCount && res.rowCount > 0) {
        await client.query(
          `UPDATE communities SET member_count = member_count + 1 WHERE id = $1`,
          [communityId]
        );
      }
    });
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await withTransaction(async (client) => {
      const res = await client.query(
        `DELETE FROM community_memberships WHERE community_id = $1 AND user_id = $2`,
        [communityId, userId]
      );

      if (res.rowCount && res.rowCount > 0) {
        await client.query(
          `UPDATE communities SET member_count = GREATEST(0, member_count - 1) WHERE id = $1`,
          [communityId]
        );
      }
    });
  }

  async getIdeas(): Promise<IdeaRecord[]> {
    return query<IdeaRecord>(
      `SELECT i.id, i.author_id, i.title, i.description, i.tags, i.art, i.created_at,
              u.name as author_name
       FROM ideas i
       LEFT JOIN users u ON u.id = i.author_id
       ORDER BY i.created_at DESC`
    );
  }

  async createIdea(
    authorId: string,
    data: { title: string; description: string; tags?: string[]; art?: string }
  ): Promise<IdeaRecord> {
    const row = await queryOne<IdeaRecord>(
      `INSERT INTO ideas (author_id, title, description, tags, art)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, author_id, title, description, tags, art, created_at`,
      [authorId, data.title, data.description, data.tags ?? [], data.art ?? 'idea']
    );
    return row!;
  }

  async getEvents(): Promise<EventRecord[]> {
    return query<EventRecord>(
      `SELECT e.id, e.organizer_id, e.title, e.description, e.tags, e.art, e.event_date,
              e.location, e.is_online, e.created_at,
              u.name as organizer_name
       FROM events e
       LEFT JOIN users u ON u.id = e.organizer_id
       ORDER BY e.created_at DESC`
    );
  }

  async createEvent(
    organizerId: string,
    data: {
      title: string;
      description: string;
      tags?: string[];
      art?: string;
      event_date?: string;
      location?: string;
      is_online?: boolean;
    }
  ): Promise<EventRecord> {
    const row = await queryOne<EventRecord>(
      `INSERT INTO events (organizer_id, title, description, tags, art, event_date, location, is_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, organizer_id, title, description, tags, art, event_date, location, is_online, created_at`,
      [
        organizerId,
        data.title,
        data.description,
        data.tags ?? [],
        data.art ?? 'event',
        data.event_date ?? null,
        data.location ?? null,
        data.is_online ?? false,
      ]
    );
    return row!;
  }

  async getSavedItems(userId: string): Promise<SavedItemRecord[]> {
    return query<SavedItemRecord>(
      `SELECT id, user_id, item_type, item_id, created_at
       FROM saved_items
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  async saveItem(
    userId: string,
    itemType: 'project' | 'idea' | 'event',
    itemId: string
  ): Promise<SavedItemRecord> {
    const row = await queryOne<SavedItemRecord>(
      `INSERT INTO saved_items (user_id, item_type, item_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_type, item_id) DO NOTHING
       RETURNING id, user_id, item_type, item_id, created_at`,
      [userId, itemType, itemId]
    );

    if (!row) {
      // already exists
      const existing = await queryOne<SavedItemRecord>(
        `SELECT id, user_id, item_type, item_id, created_at
         FROM saved_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
        [userId, itemType, itemId]
      );
      return existing!;
    }
    return row;
  }

  async unsaveItem(
    userId: string,
    itemType: 'project' | 'idea' | 'event',
    itemId: string
  ): Promise<void> {
    await query(
      `DELETE FROM saved_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
      [userId, itemType, itemId]
    );
  }

  async getActivity(userId: string, limit = 20): Promise<ActivityRecord[]> {
    return query<ActivityRecord>(
      `SELECT id, user_id, kind, title, description, reference_id, created_at
       FROM activity
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
  }
}

export const discoverService = new DiscoverService();
