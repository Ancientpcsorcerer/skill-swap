import { query, queryOne } from '../../db/client';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../utils/errors';

export interface CommentAuthor {
  id: string;
  name: string;
  username: string;
  avatar_url?: string | null;
}

export interface CommentItem {
  id: string;
  target_type: 'post' | 'project';
  target_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  is_creator: boolean;
  like_count: number;
  has_liked: boolean;
  reply_count: number;
  replies?: CommentItem[];
}

export class CommentsService {
  private async getTargetCreatorId(targetType: 'post' | 'project', targetId: string): Promise<string | null> {
    if (targetType === 'post') {
      const post = await queryOne<{ author_id: string }>(
        `SELECT author_id FROM posts WHERE id = $1`,
        [targetId]
      );
      return post?.author_id || null;
    } else {
      const proj = await queryOne<{ creator_id: string }>(
        `SELECT creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
        [targetId]
      );
      return proj?.creator_id || null;
    }
  }

  async listComments(
    targetType: 'post' | 'project',
    targetId: string,
    currentUserId?: string
  ): Promise<{ comments: CommentItem[]; total_count: number }> {
    const creatorId = await this.getTargetCreatorId(targetType, targetId);
    if (!creatorId) {
      throw new NotFoundError(`${targetType === 'post' ? 'Post' : 'Project'} not found`);
    }

    const rows = await query<{
      id: string;
      target_type: 'post' | 'project';
      target_id: string;
      user_id: string;
      parent_comment_id: string | null;
      body: string;
      is_deleted: boolean;
      edited_at: string | null;
      created_at: string;
      updated_at: string;
      user_name: string;
      user_username: string;
      user_avatar_url: string | null;
      like_count: number;
      has_liked: boolean;
      reply_count: number;
    }>(
      `SELECT c.id, c.target_type, c.target_id, c.user_id, c.parent_comment_id,
              c.body, c.is_deleted, c.edited_at, c.created_at, c.updated_at,
              u.name as user_name, u.username as user_username, u.avatar_url as user_avatar_url,
              COALESCE(cl.cnt, 0)::int as like_count,
              CASE WHEN $3::uuid IS NOT NULL AND ucl.user_id IS NOT NULL THEN true ELSE false END as has_liked,
              COALESCE(rc.cnt, 0)::int as reply_count
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN (
         SELECT comment_id, COUNT(*) as cnt
         FROM comment_likes
         GROUP BY comment_id
       ) cl ON cl.comment_id = c.id
       LEFT JOIN comment_likes ucl ON ucl.comment_id = c.id AND ucl.user_id = $3::uuid
       LEFT JOIN (
         SELECT parent_comment_id, COUNT(*) as cnt
         FROM comments
         WHERE is_deleted = false
         GROUP BY parent_comment_id
       ) rc ON rc.parent_comment_id = c.id
       WHERE c.target_type = $1 AND c.target_id = $2
       ORDER BY c.created_at ASC`,
      [targetType, targetId, currentUserId || null]
    );

    const allItems: CommentItem[] = rows.map((r) => ({
      id: r.id,
      target_type: r.target_type,
      target_id: r.target_id,
      user_id: r.user_id,
      parent_comment_id: r.parent_comment_id,
      body: r.is_deleted ? '' : r.body,
      is_deleted: Boolean(r.is_deleted),
      edited_at: r.edited_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        name: r.user_name,
        username: r.user_username,
        avatar_url: r.user_avatar_url,
      },
      is_creator: r.user_id === creatorId,
      like_count: Number(r.like_count) || 0,
      has_liked: Boolean(r.has_liked),
      reply_count: Number(r.reply_count) || 0,
      replies: [],
    }));

    // Build hierarchy: root comments with replies array
    const commentMap = new Map<string, CommentItem>();
    allItems.forEach((c) => commentMap.set(c.id, c));

    const rootComments: CommentItem[] = [];
    allItems.forEach((c) => {
      if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
        const parent = commentMap.get(c.parent_comment_id)!;
        parent.replies = parent.replies || [];
        parent.replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    // Ensure creator/admin replies are surfaced first inside each parent's replies list
    rootComments.forEach((c) => {
      if (c.replies && c.replies.length > 0) {
        c.replies.sort((a, b) => {
          if (a.is_creator && !b.is_creator) return -1;
          if (!a.is_creator && b.is_creator) return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      }
    });

    const nonDeletedCount = allItems.filter((c) => !c.is_deleted).length;
    return { comments: rootComments, total_count: nonDeletedCount };
  }

  async createComment(
    targetType: 'post' | 'project',
    targetId: string,
    userId: string,
    body: string,
    parentCommentId?: string | null
  ): Promise<CommentItem> {
    const trimmed = body?.trim();
    if (!trimmed) {
      throw new BadRequestError('Comment body cannot be empty');
    }

    const creatorId = await this.getTargetCreatorId(targetType, targetId);
    if (!creatorId) {
      throw new NotFoundError(`${targetType === 'post' ? 'Post' : 'Project'} not found`);
    }

    let validParentId: string | null = null;
    if (parentCommentId) {
      const parent = await queryOne<{ id: string; target_type: string; target_id: string; is_deleted: boolean }>(
        `SELECT id, target_type, target_id, is_deleted FROM comments WHERE id = $1`,
        [parentCommentId]
      );
      if (!parent || parent.target_type !== targetType || parent.target_id !== targetId) {
        throw new BadRequestError('Parent comment does not exist for this target');
      }
      validParentId = parent.id;
    }

    const inserted = await queryOne<{
      id: string;
      target_type: 'post' | 'project';
      target_id: string;
      user_id: string;
      parent_comment_id: string | null;
      body: string;
      is_deleted: boolean;
      edited_at: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO comments (target_type, target_id, user_id, parent_comment_id, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, target_type, target_id, user_id, parent_comment_id, body, is_deleted, edited_at, created_at, updated_at`,
      [targetType, targetId, userId, validParentId, trimmed]
    );

    const user = await queryOne<{ name: string; username: string; avatar_url: string | null }>(
      `SELECT name, username, avatar_url FROM users WHERE id = $1`,
      [userId]
    );

    return {
      id: inserted!.id,
      target_type: inserted!.target_type,
      target_id: inserted!.target_id,
      user_id: inserted!.user_id,
      parent_comment_id: inserted!.parent_comment_id,
      body: inserted!.body,
      is_deleted: false,
      edited_at: null,
      created_at: inserted!.created_at,
      updated_at: inserted!.updated_at,
      author: {
        id: userId,
        name: user?.name || 'User',
        username: user?.username || 'user',
        avatar_url: user?.avatar_url || null,
      },
      is_creator: userId === creatorId,
      like_count: 0,
      has_liked: false,
      reply_count: 0,
      replies: [],
    };
  }

  async updateComment(commentId: string, userId: string, body: string): Promise<CommentItem> {
    const trimmed = body?.trim();
    if (!trimmed) throw new BadRequestError('Comment body cannot be empty');

    const comment = await queryOne<{
      id: string;
      user_id: string;
      target_type: 'post' | 'project';
      target_id: string;
      is_deleted: boolean;
      parent_comment_id: string | null;
      created_at: string;
    }>(
      `SELECT id, user_id, target_type, target_id, is_deleted, parent_comment_id, created_at FROM comments WHERE id = $1`,
      [commentId]
    );

    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.user_id !== userId) {
      throw new ForbiddenError('You can only edit your own comments');
    }
    if (comment.is_deleted) {
      throw new BadRequestError('Cannot edit a deleted comment');
    }

    const updated = await queryOne<{
      id: string;
      body: string;
      edited_at: string;
      updated_at: string;
    }>(
      `UPDATE comments
       SET body = $1, edited_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING id, body, edited_at, updated_at`,
      [trimmed, commentId]
    );

    const creatorId = await this.getTargetCreatorId(comment.target_type, comment.target_id);
    const user = await queryOne<{ name: string; username: string; avatar_url: string | null }>(
      `SELECT name, username, avatar_url FROM users WHERE id = $1`,
      [userId]
    );

    const likes = await queryOne<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM comment_likes WHERE comment_id = $1`,
      [commentId]
    );
    const userLike = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId]
    );
    const replies = await queryOne<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM comments WHERE parent_comment_id = $1 AND is_deleted = false`,
      [commentId]
    );

    return {
      id: comment.id,
      target_type: comment.target_type,
      target_id: comment.target_id,
      user_id: comment.user_id,
      parent_comment_id: comment.parent_comment_id,
      body: updated!.body,
      is_deleted: false,
      edited_at: updated!.edited_at,
      created_at: comment.created_at,
      updated_at: updated!.updated_at,
      author: {
        id: userId,
        name: user?.name || 'User',
        username: user?.username || 'user',
        avatar_url: user?.avatar_url || null,
      },
      is_creator: userId === creatorId,
      like_count: parseInt(likes?.cnt || '0', 10),
      has_liked: !!userLike,
      reply_count: parseInt(replies?.cnt || '0', 10),
      replies: [],
    };
  }

  async deleteComment(commentId: string, userId: string): Promise<{ success: boolean; comment: CommentItem }> {
    const comment = await queryOne<{
      id: string;
      user_id: string;
      target_type: 'post' | 'project';
      target_id: string;
      is_deleted: boolean;
      parent_comment_id: string | null;
      created_at: string;
    }>(
      `SELECT id, user_id, target_type, target_id, is_deleted, parent_comment_id, created_at FROM comments WHERE id = $1`,
      [commentId]
    );

    if (!comment) throw new NotFoundError('Comment not found');

    const creatorId = await this.getTargetCreatorId(comment.target_type, comment.target_id);
    const isOwner = comment.user_id === userId;
    const isTargetCreator = creatorId === userId;

    if (!isOwner && !isTargetCreator) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    const updated = await queryOne<{
      id: string;
      edited_at: string;
      updated_at: string;
    }>(
      `UPDATE comments
       SET is_deleted = true, body = '', edited_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, edited_at, updated_at`,
      [commentId]
    );

    const user = await queryOne<{ name: string; username: string; avatar_url: string | null }>(
      `SELECT name, username, avatar_url FROM users WHERE id = $1`,
      [comment.user_id]
    );

    return {
      success: true,
      comment: {
        id: comment.id,
        target_type: comment.target_type,
        target_id: comment.target_id,
        user_id: comment.user_id,
        parent_comment_id: comment.parent_comment_id,
        body: '',
        is_deleted: true,
        edited_at: updated!.edited_at,
        created_at: comment.created_at,
        updated_at: updated!.updated_at,
        author: {
          id: comment.user_id,
          name: user?.name || 'User',
          username: user?.username || 'user',
          avatar_url: user?.avatar_url || null,
        },
        is_creator: comment.user_id === creatorId,
        like_count: 0,
        has_liked: false,
        reply_count: 0,
        replies: [],
      },
    };
  }

  async likeComment(commentId: string, userId: string): Promise<{ like_count: number; has_liked: boolean }> {
    const comment = await queryOne<{ id: string }>(`SELECT id FROM comments WHERE id = $1`, [commentId]);
    if (!comment) throw new NotFoundError('Comment not found');

    await query(
      `INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT (comment_id, user_id) DO NOTHING`,
      [commentId, userId]
    );

    const row = await queryOne<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM comment_likes WHERE comment_id = $1`,
      [commentId]
    );

    return {
      like_count: parseInt(row?.cnt || '0', 10),
      has_liked: true,
    };
  }

  async unlikeComment(commentId: string, userId: string): Promise<{ like_count: number; has_liked: boolean }> {
    await query(
      `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId]
    );

    const row = await queryOne<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM comment_likes WHERE comment_id = $1`,
      [commentId]
    );

    return {
      like_count: parseInt(row?.cnt || '0', 10),
      has_liked: false,
    };
  }

  async reportComment(commentId: string, userId: string, reason: string): Promise<{ report_id: string }> {
    const comment = await queryOne<{ id: string }>(`SELECT id FROM comments WHERE id = $1`, [commentId]);
    if (!comment) throw new NotFoundError('Comment not found');

    const row = await queryOne<{ id: string }>(
      `INSERT INTO content_reports (reporter_user_id, target_type, target_id, reason)
       VALUES ($1, 'comment', $2, $3)
       RETURNING id`,
      [userId, commentId, reason || 'Inappropriate content']
    );

    return { report_id: row!.id };
  }
}

export const commentsService = new CommentsService();
