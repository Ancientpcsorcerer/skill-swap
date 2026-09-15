import { query, queryOne, withTransaction } from '../../db/client';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';

export interface ProjectUpdateRecord {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url: string | null;
  title: string;
  body: string;
  image_urls: string[];
  video_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectRecord {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  vision: string;
  type: string;
  status: string;
  art: string;
  is_discoverable: boolean;
  visibility: 'public' | 'private';
  cover_image_url?: string | null;
  recreated_from_id?: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  required_skills?: string[];
  creator_name?: string;
  creator_username?: string;
  creator_avatar_url?: string | null;
  follower_count?: number;
  is_following?: boolean;
  members?: Array<{
    id: string;
    user_id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    role: string;
    joined_at: string;
  }>;
}

export class ProjectsService {
  async listProjects(
    params: {
      q?: string;
      tag?: string;
      type?: string;
      skill?: string;
      status?: string;
      creatorId?: string;
      limit?: number;
      offset?: number;
    },
    currentUserId?: string
  ): Promise<{ projects: ProjectRecord[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const conditions: string[] = ['p.deleted_at IS NULL'];
    const sqlParams: unknown[] = [];
    let idx = 1;

    // Visibility filter (Bug F8, F9):
    // Public projects are visible to all.
    // Private projects are only visible to creator, members, or authorized connections.
    if (currentUserId) {
      conditions.push(`(
        p.visibility = 'public' OR
        p.creator_id = $${idx} OR
        EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $${idx}) OR
        EXISTS (SELECT 1 FROM project_authorized_connections pac WHERE pac.project_id = p.id AND pac.user_id = $${idx})
      )`);
      sqlParams.push(currentUserId);
      idx++;
    } else {
      conditions.push(`p.visibility = 'public'`);
    }

    if (params.creatorId) {
      conditions.push(`p.creator_id = $${idx++}`);
      sqlParams.push(params.creatorId);
    }

    if (params.status) {
      conditions.push(`p.status = $${idx++}`);
      sqlParams.push(params.status);
    }

    if (params.type) {
      conditions.push(`p.type ILIKE $${idx++}`);
      sqlParams.push(params.type);
    }

    if (params.q && params.q.trim()) {
      conditions.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR p.vision ILIKE $${idx})`);
      sqlParams.push(`%${params.q.trim()}%`);
      idx++;
    }

    if (params.tag && params.tag.trim()) {
      conditions.push(`EXISTS (SELECT 1 FROM project_tags pt WHERE pt.project_id = p.id AND pt.tag ILIKE $${idx})`);
      sqlParams.push(`%${params.tag.trim()}%`);
      idx++;
    }

    if (params.skill && params.skill.trim()) {
      conditions.push(
        `EXISTS (SELECT 1 FROM project_required_skills prs WHERE prs.project_id = p.id AND prs.skill ILIKE $${idx})`
      );
      sqlParams.push(`%${params.skill.trim()}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countRes = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM projects p WHERE ${whereClause}`,
      sqlParams
    );
    const total = parseInt(countRes?.count || '0', 10);

    // Projects with creator info and follower counts
    sqlParams.push(limit);
    sqlParams.push(offset);
    const rows = await query<ProjectRecord>(
      `SELECT p.id, p.creator_id, p.title, p.description, p.vision, p.type, p.status, p.art,
              p.is_discoverable, COALESCE(p.visibility, 'public') as visibility,
              p.cover_image_url, p.recreated_from_id, p.created_at, p.updated_at,
              u.name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar_url,
              (SELECT COUNT(*)::int FROM project_followers pf WHERE pf.project_id = p.id) as follower_count
       FROM projects p
       JOIN users u ON u.id = p.creator_id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      sqlParams
    );

    const populated = await Promise.all(
      rows.map(async (project) => {
        const [tags, required_skills, is_following] = await Promise.all([
          this.getProjectTags(project.id),
          this.getProjectSkills(project.id),
          currentUserId ? this.checkIsFollowing(project.id, currentUserId) : Promise.resolve(false),
        ]);
        return {
          ...project,
          tags,
          required_skills,
          is_following,
        };
      })
    );

    return { projects: populated, total };
  }

  async getProjectById(id: string, currentUserId?: string): Promise<ProjectRecord> {
    const project = await queryOne<ProjectRecord>(
      `SELECT p.id, p.creator_id, p.title, p.description, p.vision, p.type, p.status, p.art,
              p.is_discoverable, COALESCE(p.visibility, 'public') as visibility,
              p.cover_image_url, p.recreated_from_id, p.created_at, p.updated_at,
              u.name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar_url,
              (SELECT COUNT(*)::int FROM project_followers pf WHERE pf.project_id = p.id) as follower_count
       FROM projects p
       JOIN users u ON u.id = p.creator_id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Enforce private visibility server-side (Bug F8, F9)
    if (project.visibility === 'private') {
      if (!currentUserId) {
        throw new ForbiddenError('This project is private. Authentication required.');
      }
      const hasAccess =
        project.creator_id === currentUserId ||
        (await this.checkIsMember(id, currentUserId)) ||
        (await this.checkIsAuthorizedConnection(id, currentUserId));

      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to view this private project.');
      }
    }

    const [tags, required_skills, members, is_following] = await Promise.all([
      this.getProjectTags(id),
      this.getProjectSkills(id),
      this.getProjectMembers(id),
      currentUserId ? this.checkIsFollowing(id, currentUserId) : Promise.resolve(false),
    ]);

    return {
      ...project,
      tags,
      required_skills,
      members,
      is_following,
    };
  }

  async createProject(
    creatorId: string,
    input: CreateProjectInput & {
      visibility?: 'public' | 'private';
      cover_image_url?: string;
      image_urls?: string[];
      video_urls?: string[];
    }
  ): Promise<ProjectRecord> {
    const images = input.image_urls || [];
    const videos = input.video_urls || [];

    // Enforce media limits server-side (Bug F1: Max 7 images, 3 videos)
    if (images.length > 7) {
      throw new BadRequestError('Project creation media limit exceeded: Maximum 7 images allowed.');
    }
    if (videos.length > 3) {
      throw new BadRequestError('Project creation media limit exceeded: Maximum 3 videos allowed.');
    }

    // Default cover image to first uploaded image if not explicitly chosen (Bug F3)
    const coverUrl = input.cover_image_url || (images.length > 0 ? images[0] : null);

    return withTransaction(async (client) => {
      const pRes = await client.query<ProjectRecord>(
        `INSERT INTO projects (creator_id, title, description, vision, type, status, art, is_discoverable, visibility, cover_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          creatorId,
          input.title,
          input.description,
          input.vision,
          input.type,
          input.status,
          input.art,
          input.is_discoverable,
          input.visibility || 'public',
          coverUrl,
        ]
      );
      const project = pRes.rows[0];

      // Add tags
      for (const tag of input.tags) {
        if (tag.trim()) {
          await client.query(
            `INSERT INTO project_tags (project_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [project.id, tag.trim()]
          );
        }
      }

      // Add required skills
      for (const skill of input.required_skills) {
        if (skill.trim()) {
          await client.query(
            `INSERT INTO project_required_skills (project_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [project.id, skill.trim()]
          );
        }
      }

      // Add creator as owner member
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [project.id, creatorId]
      );

      // Create activity record
      await client.query(
        `INSERT INTO activity (user_id, kind, title, description, reference_id)
         VALUES ($1, 'project', $2, $3, $4)`,
        [creatorId, `Created project "${input.title}"`, input.description.slice(0, 100), project.id]
      );

      return project;
    }).then(async (newProj) => this.getProjectById(newProj.id, creatorId));
  }

  async updateProject(
    projectId: string,
    userId: string,
    input: UpdateProjectInput & { cover_image_url?: string; visibility?: 'public' | 'private' }
  ): Promise<ProjectRecord> {
    const existing = await queryOne<ProjectRecord>(
      `SELECT id, creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );

    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    if (existing.creator_id !== userId) {
      throw new ForbiddenError('Only the project creator can edit this project');
    }

    return withTransaction(async (client) => {
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${idx++}`);
        values.push(input.title);
      }
      if (input.description !== undefined) {
        updates.push(`description = $${idx++}`);
        values.push(input.description);
      }
      if (input.vision !== undefined) {
        updates.push(`vision = $${idx++}`);
        values.push(input.vision);
      }
      if (input.type !== undefined) {
        updates.push(`type = $${idx++}`);
        values.push(input.type);
      }
      if (input.status !== undefined) {
        updates.push(`status = $${idx++}`);
        values.push(input.status);
      }
      if (input.art !== undefined) {
        updates.push(`art = $${idx++}`);
        values.push(input.art);
      }
      if (input.is_discoverable !== undefined) {
        updates.push(`is_discoverable = $${idx++}`);
        values.push(input.is_discoverable);
      }
      if (input.cover_image_url !== undefined) {
        updates.push(`cover_image_url = $${idx++}`);
        values.push(input.cover_image_url);
      }
      if (input.visibility !== undefined) {
        updates.push(`visibility = $${idx++}`);
        values.push(input.visibility);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(projectId);
        await client.query(
          `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx}`,
          values
        );
      }

      if (input.tags !== undefined) {
        await client.query(`DELETE FROM project_tags WHERE project_id = $1`, [projectId]);
        for (const tag of input.tags) {
          if (tag.trim()) {
            await client.query(
              `INSERT INTO project_tags (project_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [projectId, tag.trim()]
            );
          }
        }
      }

      if (input.required_skills !== undefined) {
        await client.query(`DELETE FROM project_required_skills WHERE project_id = $1`, [projectId]);
        for (const skill of input.required_skills) {
          if (skill.trim()) {
            await client.query(
              `INSERT INTO project_required_skills (project_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [projectId, skill.trim()]
            );
          }
        }
      }
    }).then(async () => this.getProjectById(projectId, userId));
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    const existing = await queryOne<ProjectRecord>(
      `SELECT id, creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );

    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    if (existing.creator_id !== userId) {
      throw new ForbiddenError('Only the project creator can delete this project');
    }

    await query(`UPDATE projects SET deleted_at = NOW() WHERE id = $1`, [projectId]);
  }

  // Cover Image Selection (Bug F3)
  async setCoverImage(projectId: string, userId: string, coverImageUrl: string): Promise<ProjectRecord> {
    const project = await queryOne<ProjectRecord>(
      `SELECT id, creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    if (!project) throw new NotFoundError('Project not found');
    if (project.creator_id !== userId) throw new ForbiddenError('Only the project creator can change the cover image');

    await query(`UPDATE projects SET cover_image_url = $1, updated_at = NOW() WHERE id = $2`, [
      coverImageUrl,
      projectId,
    ]);
    return this.getProjectById(projectId, userId);
  }

  // Visibility Toggle (Bug F8, F10)
  async updateVisibility(projectId: string, userId: string, visibility: 'public' | 'private'): Promise<ProjectRecord> {
    const project = await queryOne<ProjectRecord>(
      `SELECT id, creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    if (!project) throw new NotFoundError('Project not found');
    if (project.creator_id !== userId) throw new ForbiddenError('Only the project creator can toggle visibility');

    await query(`UPDATE projects SET visibility = $1, updated_at = NOW() WHERE id = $2`, [
      visibility,
      projectId,
    ]);
    return this.getProjectById(projectId, userId);
  }

  // Follow vs Join (Bug F6)
  async followProject(projectId: string, userId: string): Promise<{ is_following: boolean; follower_count: number }> {
    const project = await queryOne<{ id: string }>(`SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`, [
      projectId,
    ]);
    if (!project) throw new NotFoundError('Project not found');

    await query(
      `INSERT INTO project_followers (project_id, user_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      [projectId, userId]
    );

    const countRes = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM project_followers WHERE project_id = $1`,
      [projectId]
    );

    return {
      is_following: true,
      follower_count: parseInt(countRes?.count || '0', 10),
    };
  }

  async unfollowProject(projectId: string, userId: string): Promise<{ is_following: boolean; follower_count: number }> {
    await query(`DELETE FROM project_followers WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);

    const countRes = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM project_followers WHERE project_id = $1`,
      [projectId]
    );

    return {
      is_following: false,
      follower_count: parseInt(countRes?.count || '0', 10),
    };
  }

  async joinProject(projectId: string, userId: string): Promise<void> {
    const project = await queryOne<{ id: string }>(`SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`, [
      projectId,
    ]);
    if (!project) throw new NotFoundError('Project not found');

    await query(
      `INSERT INTO project_members (project_id, user_id, role, joined_at)
       VALUES ($1, $2, 'collaborator', NOW())
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [projectId, userId]
    );
  }

  // Recreate Completed Project (Bug F7)
  async recreateProject(projectId: string, userId: string): Promise<ProjectRecord> {
    const original = await this.getProjectById(projectId, userId);
    if (!original) throw new NotFoundError('Original project not found');

    // Create a new clean fork preserving provenance without private members/files
    const forkTitle = `Recreation of ${original.title}`.slice(0, 100);
    const forkDescription = `Inspired by and based on "${original.title}".\n\nOriginal overview:\n${original.description}`;

    return withTransaction(async (client) => {
      const pRes = await client.query<ProjectRecord>(
        `INSERT INTO projects (creator_id, title, description, vision, type, status, art, is_discoverable, visibility, recreated_from_id)
         VALUES ($1, $2, $3, $4, $5, 'Ongoing', $6, true, 'public', $7)
         RETURNING *`,
        [userId, forkTitle, forkDescription, original.vision, original.type, original.art, original.id]
      );
      const newProj = pRes.rows[0];

      // Copy tags
      if (original.tags) {
        for (const tag of original.tags) {
          await client.query(
            `INSERT INTO project_tags (project_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newProj.id, tag]
          );
        }
      }

      // Copy required skills
      if (original.required_skills) {
        for (const skill of original.required_skills) {
          await client.query(
            `INSERT INTO project_required_skills (project_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newProj.id, skill]
          );
        }
      }

      // Add recreating user as owner
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [newProj.id, userId]
      );

      return newProj;
    }).then(async (created) => this.getProjectById(created.id, userId));
  }

  // Project Updates (Bug F4, F5, F9)
  async addProjectUpdate(
    projectId: string,
    authorId: string,
    data: {
      title: string;
      body: string;
      image_urls?: string[];
      video_urls?: string[];
    }
  ): Promise<ProjectUpdateRecord> {
    const project = await this.getProjectById(projectId, authorId);
    if (!project) throw new NotFoundError('Project not found');

    // Only project creator or members can post updates
    const isMember = await this.checkIsMember(projectId, authorId);
    if (project.creator_id !== authorId && !isMember) {
      throw new ForbiddenError('Only project team members can post updates.');
    }

    const images = data.image_urls || [];
    const videos = data.video_urls || [];

    // Enforce limits (Bug F5: Max 7 images, 3 videos)
    if (images.length > 7) {
      throw new BadRequestError('Update media limit exceeded: Maximum 7 images allowed.');
    }
    if (videos.length > 3) {
      throw new BadRequestError('Update media limit exceeded: Maximum 3 videos allowed.');
    }

    if (!data.title?.trim() || !data.body?.trim()) {
      throw new BadRequestError('Update title and body are required.');
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO project_updates (project_id, author_id, title, body, image_urls, video_urls, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [projectId, authorId, data.title.trim(), data.body.trim(), images, videos]
    );

    const updates = await this.getProjectUpdates(projectId, authorId);
    return updates.find((u) => u.id === row!.id)!;
  }

  async getProjectUpdates(projectId: string, currentUserId?: string): Promise<ProjectUpdateRecord[]> {
    // Check project visibility first (Bug F9)
    await this.getProjectById(projectId, currentUserId);

    const rows = await query<ProjectUpdateRecord>(
      `SELECT pu.id, pu.project_id, pu.author_id, pu.title, pu.body,
              pu.image_urls, pu.video_urls, pu.created_at, pu.updated_at,
              u.name as author_name, u.username as author_username, u.avatar_url as author_avatar_url
       FROM project_updates pu
       JOIN users u ON u.id = pu.author_id
       WHERE pu.project_id = $1
       ORDER BY pu.created_at DESC`,
      [projectId]
    );

    return rows;
  }

  private async checkIsFollowing(projectId: string, userId: string): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM project_followers WHERE project_id = $1 AND user_id = $2) as exists`,
      [projectId, userId]
    );
    return row?.exists || false;
  }

  private async checkIsMember(projectId: string, userId: string): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2) as exists`,
      [projectId, userId]
    );
    return row?.exists || false;
  }

  private async checkIsAuthorizedConnection(projectId: string, userId: string): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM project_authorized_connections WHERE project_id = $1 AND user_id = $2) as exists`,
      [projectId, userId]
    );
    return row?.exists || false;
  }

  private async getProjectTags(projectId: string): Promise<string[]> {
    const rows = await query<{ tag: string }>(
      `SELECT tag FROM project_tags WHERE project_id = $1 ORDER BY tag ASC`,
      [projectId]
    );
    return rows.map((r) => r.tag);
  }

  private async getProjectSkills(projectId: string): Promise<string[]> {
    const rows = await query<{ skill: string }>(
      `SELECT skill FROM project_required_skills WHERE project_id = $1 ORDER BY skill ASC`,
      [projectId]
    );
    return rows.map((r) => r.skill);
  }

  private async getProjectMembers(projectId: string) {
    return query<{
      id: string;
      user_id: string;
      name: string;
      username: string;
      avatar_url: string | null;
      role: string;
      joined_at: string;
    }>(
      `SELECT pm.id, pm.user_id, pm.role, pm.joined_at,
              u.name, u.username, u.avatar_url
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [projectId]
    );
  }

  async addMember(projectId: string, currentUserId: string, targetUserId: string, role?: string): Promise<void> {
    const project = await this.getProjectById(projectId, currentUserId);
    if (!project) throw new NotFoundError('Project not found');
    if (project.creator_id !== currentUserId) {
      throw new ForbiddenError('Only project owner can add team members');
    }
    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [projectId, targetUserId, role || 'contributor']
    );
  }

  async removeMember(projectId: string, currentUserId: string, targetUserId: string): Promise<void> {
    const project = await this.getProjectById(projectId, currentUserId);
    if (!project) throw new NotFoundError('Project not found');
    if (project.creator_id !== currentUserId && currentUserId !== targetUserId) {
      throw new ForbiddenError('Permission denied to remove member');
    }
    await query(
      `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, targetUserId]
    );
  }
}

export const projectsService = new ProjectsService();
