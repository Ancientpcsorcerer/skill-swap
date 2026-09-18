import { query, queryOne } from '../../db/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

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
  like_count: number;
  has_liked?: boolean;
  comment_count: number;
  repost_count: number;
  has_reposted?: boolean;
  has_saved?: boolean;
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
             (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as like_count,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_liked,
             (SELECT COUNT(*)::int FROM comments WHERE target_type = 'post' AND target_id = p.id AND is_deleted = false) as comment_count,
             (SELECT COUNT(*)::int FROM reposts WHERE original_post_id = p.id) as repost_count,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM reposts WHERE original_post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_reposted,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM post_saves WHERE post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_saved,
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
             (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as like_count,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_liked,
             (SELECT COUNT(*)::int FROM comments WHERE target_type = 'post' AND target_id = p.id AND is_deleted = false) as comment_count,
             (SELECT COUNT(*)::int FROM reposts WHERE original_post_id = p.id) as repost_count,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM reposts WHERE original_post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_reposted,
             CASE WHEN $1::text IS NOT NULL THEN
               EXISTS(SELECT 1 FROM post_saves WHERE post_id = p.id AND user_id = $1::uuid)
             ELSE false END as has_saved,
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
             like_count, has_liked, comment_count,
             repost_count, has_reposted, has_saved, repost_id, reposted_by
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
      like_count: Number(r.like_count || 0),
      has_liked: Boolean(r.has_liked),
      comment_count: Number(r.comment_count || 0),
      repost_count: Number(r.repost_count || 0),
      has_reposted: Boolean(r.has_reposted),
      has_saved: Boolean(r.has_saved),
      reposted_by: r.reposted_by || null,
    }));
  }

  async getPostById(postId: string, currentUserId?: string): Promise<PostRecord> {
    const row = await queryOne<any>(
      `SELECT p.id, p.author_id, p.title, p.content, p.tags, p.project_tag, p.art,
              p.image_urls, p.video_urls, p.created_at, p.updated_at,
              u.name as author_name, u.username as author_username, u.avatar_url as author_avatar_url,
              (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as like_count,
              CASE WHEN $2::text IS NOT NULL THEN
                EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2::uuid)
              ELSE false END as has_liked,
              (SELECT COUNT(*)::int FROM comments WHERE target_type = 'post' AND target_id = p.id AND is_deleted = false) as comment_count,
              (SELECT COUNT(*)::int FROM reposts WHERE original_post_id = p.id) as repost_count,
              CASE WHEN $2::text IS NOT NULL THEN
                EXISTS(SELECT 1 FROM reposts WHERE original_post_id = p.id AND user_id = $2::uuid)
              ELSE false END as has_reposted,
              CASE WHEN $2::text IS NOT NULL THEN
                EXISTS(SELECT 1 FROM post_saves WHERE post_id = p.id AND user_id = $2::uuid)
              ELSE false END as has_saved
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [postId, currentUserId || null]
    );

    if (!row) {
      throw new NotFoundError('Post not found');
    }

    return {
      ...row,
      like_count: Number(row.like_count || 0),
      has_liked: Boolean(row.has_liked),
      comment_count: Number(row.comment_count || 0),
      repost_count: Number(row.repost_count || 0),
      has_reposted: Boolean(row.has_reposted),
      has_saved: Boolean(row.has_saved),
      repost_id: null,
      reposted_by: null,
    };
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

    return this.getPostById(row!.id, authorId);
  }

  async updatePost(
    postId: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      tags?: string[];
      project_tag?: string;
      art?: string;
      image_urls?: string[];
      video_urls?: string[];
    }
  ): Promise<PostRecord> {
    const post = await queryOne<{ author_id: string }>(`SELECT author_id FROM posts WHERE id = $1`, [postId]);
    if (!post) throw new NotFoundError('Post not found');
    if (post.author_id !== userId) {
      throw new ForbiddenError('You can only edit your own posts');
    }

    const images = data.image_urls;
    const videos = data.video_urls;
    if (images && images.length > 7) {
      throw new BadRequestError('Post media limit exceeded: Maximum 7 images allowed.');
    }
    if (videos && videos.length > 2) {
      throw new BadRequestError('Post media limit exceeded: Maximum 2 videos allowed.');
    }

    await query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           tags = COALESCE($3, tags),
           project_tag = COALESCE($4, project_tag),
           art = COALESCE($5, art),
           image_urls = COALESCE($6, image_urls),
           video_urls = COALESCE($7, video_urls),
           updated_at = NOW()
       WHERE id = $8`,
      [
        data.title?.trim() || null,
        data.content?.trim() || null,
        data.tags || null,
        data.project_tag !== undefined ? data.project_tag : null,
        data.art || null,
        images || null,
        videos || null,
        postId,
      ]
    );

    return this.getPostById(postId, userId);
  }

  async deletePost(postId: string, userId: string): Promise<{ success: boolean }> {
    const post = await queryOne<{ author_id: string }>(`SELECT author_id FROM posts WHERE id = $1`, [postId]);
    if (!post) throw new NotFoundError('Post not found');
    if (post.author_id !== userId) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await query(`DELETE FROM posts WHERE id = $1`, [postId]);
    return { success: true };
  }

  async likePost(userId: string, postId: string): Promise<{ success: boolean; likeCount: number; hasLiked: boolean }> {
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) throw new NotFoundError('Post not found');

    await query(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, userId]
    );

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM post_likes WHERE post_id = $1`,
      [postId]
    );

    return {
      success: true,
      likeCount: Number(countRow?.count || 0),
      hasLiked: true,
    };
  }

  async unlikePost(userId: string, postId: string): Promise<{ success: boolean; likeCount: number; hasLiked: boolean }> {
    await query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM post_likes WHERE post_id = $1`,
      [postId]
    );

    return {
      success: true,
      likeCount: Number(countRow?.count || 0),
      hasLiked: false,
    };
  }

  async savePost(userId: string, postId: string): Promise<{ success: boolean; hasSaved: boolean }> {
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) throw new NotFoundError('Post not found');

    await query(
      `INSERT INTO post_saves (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, userId]
    );

    return { success: true, hasSaved: true };
  }

  async unsavePost(userId: string, postId: string): Promise<{ success: boolean; hasSaved: boolean }> {
    await query(`DELETE FROM post_saves WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
    return { success: true, hasSaved: false };
  }

  async reportPost(userId: string, postId: string, reason: string): Promise<{ success: boolean; reportId: string }> {
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) throw new NotFoundError('Post not found');

    const row = await queryOne<{ id: string }>(
      `INSERT INTO content_reports (reporter_user_id, target_type, target_id, reason)
       VALUES ($1, 'post', $2, $3)
       RETURNING id`,
      [userId, postId, reason || 'Inappropriate content']
    );

    return { success: true, reportId: row!.id };
  }

  async repost(userId: string, postId: string): Promise<{ success: boolean; repostCount: number; hasReposted: boolean }> {
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    await query(
      `INSERT INTO reposts (original_post_id, user_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, original_post_id) DO NOTHING`,
      [postId, userId]
    );

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
    const post = await queryOne<{ id: string }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    await query(`DELETE FROM reposts WHERE original_post_id = $1 AND user_id = $2`, [postId, userId]);

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
