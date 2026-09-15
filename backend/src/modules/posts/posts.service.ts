import { query, queryOne } from '../../db/client';
import { BadRequestError } from '../../utils/errors';

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
  created_at: string;
  updated_at: string;
}

export class PostsService {
  async listPosts(authorId?: string): Promise<PostRecord[]> {
    let sql = `
      SELECT p.id, p.author_id, p.title, p.content, p.tags, p.project_tag, p.art,
             p.image_urls, p.video_urls, p.created_at, p.updated_at,
             u.name as author_name, u.username as author_username, u.avatar_url as author_avatar_url
      FROM posts p
      JOIN users u ON u.id = p.author_id
    `;
    const params: any[] = [];

    if (authorId) {
      sql += ` WHERE p.author_id = $1`;
      params.push(authorId);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 100`;

    const rows = await query<PostRecord>(sql, params);
    return rows;
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

    const full = await this.listPosts();
    const created = full.find((p) => p.id === row!.id);
    return created!;
  }
}

export const postsService = new PostsService();
