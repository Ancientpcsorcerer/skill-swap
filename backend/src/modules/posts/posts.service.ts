import { query, queryOne } from '../../db/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export interface RepostedByInfo {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface PostRecord {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url: string | null;
  title: string;
  content: string;
  tags: string[];
  project_tag: string | null;
  art: string;
  image_urls: string[];
  video_urls: string[];
  repost_count: number;
  has_reposted?: boolean;
  repost_id?: string | null;
  reposted_by?: RepostedByInfo | null;
  created_at: string;
  updated_at: string;
}

export class PostsService {
  async listPosts(authorId?: string, currentUserId?: string): Promise<PostRecord[]> {
    // 1. Direct posts
    let directSql = `
      SELECT p.id, p.author_id, p.title, p.content, p.tags, p.project_tag, p.art,
             p.image_urls, p.video_urls, p.created_at, p.updated_at,
             u.name as author_name, u.username as author_username, u.avatar_url as author_avatar_url,
             (SELECT COUNT(*)::int FROM reposts WHERE original_post_id = p.id) as repost_count,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM reposts WHERE original_post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_reposted,
             NULL::uuid as repost_id,
             NULL::jsonb as reposted_by,
             p.created_at as feed_order_time
      FROM posts p
      JOIN users u ON u.id = p.author_id
    `;
    const directParams: any[] = [currentUserId || null];

    if (authorId) {
      directSql += ` WHERE p.author_id = $2`;
      directParams.push(authorId);
    }

    // 2. Reposted posts (feed items pointing to canonical original posts with provenance)
    let repostSql = `
      SELECT p.id, p.author_id, p.title, p.content, p.tags, p.project_tag, p.art,
             p.image_urls, p.video_urls, p.created_at, p.updated_at,
             u.name as author_name, u.username as author_username, u.avatar_url as author_avatar_url,
             (SELECT COUNT(*)::int FROM reposts WHERE original_post_id = p.id) as repost_count,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM reposts WHERE original_post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_reposted,
             r.id as repost_id,
             jsonb_build_object(
               'id', ru.id,
               'name', ru.name,
               'username', ru.username,
               'avatar_url', ru.avatar_url,
               'created_at', r.created_at
             ) as reposted_by,
             r.created_at as feed_order_time
      FROM reposts r
      JOIN posts p ON p.id = r.original_post_id
      JOIN users u ON u.id = p.author_id
      JOIN users ru ON ru.id = r.user_id
    `;
    const repostParams: any[] = [currentUserId || null];

    if (authorId) {
      repostSql += ` WHERE r.user_id = $2`;
      repostParams.push(authorId);
    }

    const unionSql = `
      SELECT id, author_id, title, content, tags, project_tag, art,
             image_urls, video_urls, created_at, updated_at,
             author_name, author_username, author_avatar_url,
             repost_count, has_reposted, repost_id, reposted_by
      FROM (
        (${directSql})
        UNION ALL
        (${repostSql})
      ) combined_feed
      ORDER BY feed_order_time DESC
      LIMIT 100
    `;

    const rows = await query<any>(unionSql, authorId ? [currentUserId || null, authorId] : [currentUserId || null]);
    return rows.map((r) => ({
      ...r,
      repost_count: Number(r.repost_count || 0),
      has_reposted: Boolean(r.has_reposted),
      reposted_by: r.reposted_by || null,
    }));
  }

  async createPost(
    authorId: string,
    data: {
      title: string;
      content: string;
      tags?: string[];
      project_tag?: string;
      art?: string;
      image_urls?: string[];
      video_urls?: string[];
    }
  ): Promise<PostRecord> {
    const images = data.image_urls || [];
    const videos = data.video_urls || [];

    // Enforce strict media limits (Bug F2: Max 7 images, 2 videos)
    if (images.length > 7) {
      throw new BadRequestError('Post media limit exceeded: Maximum 7 images allowed.');
    }
    if (videos.length > 2) {
      throw new BadRequestError('Post media limit exceeded: Maximum 2 videos allowed.');
    }

    if (!data.title?.trim() || !data.content?.trim()) {
      throw new BadRequestError('Post title and content are required.');
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO posts (author_id, title, content, tags, project_tag, art, image_urls, video_urls, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`,
      [
        authorId,
        data.title.trim(),
        data.content.trim(),
        data.tags || [],
        data.project_tag?.trim() || null,
        data.art || 'idea',
        images,
        videos,
      ]
    );

    const full = await this.listPosts(undefined, authorId);
    const created = full.find((p) => p.id === row!.id);
    return created!;
  }

  async repost(userId: string, postId: string): Promise<{ success: boolean; repostCount: number; hasReposted: boolean }> {
    // 1. Verify post exists
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // 2. Insert repost
    await query(
      `INSERT INTO reposts (original_post_id, user_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, original_post_id) DO NOTHING`,
      [postId, userId]
    );

    // 3. Get canonical count
    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM reposts WHERE original_post_id = $1`,
      [postId]
    );

    return {
      success: true,
      repostCount: Number(countRow?.count || 0),
      hasReposted: true,
    };
  }

  async unrepost(userId: string, postId: string): Promise<{ success: boolean; repostCount: number; hasReposted: boolean }> {
    // 1. Verify post exists
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // 2. Delete repost
    await query(`DELETE FROM reposts WHERE original_post_id = $1 AND user_id = $2`, [postId, userId]);

    // 3. Get canonical count
    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM reposts WHERE original_post_id = $1`,
      [postId]
    );

    return {
      success: true,
      repostCount: Number(countRow?.count || 0),
      hasReposted: false,
    };
  }
}

export const postsService = new PostsService();

