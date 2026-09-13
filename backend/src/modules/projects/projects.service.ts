import { query, queryOne, withTransaction } from '../../db/client';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';

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
  created_at: string;
  updated_at: string;
  tags?: string[];
  required_skills?: string[];
  creator_name?: string;
  creator_username?: string;
  creator_avatar_url?: string | null;
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
  async listProjects(params: {
    q?: string;
    tag?: string;
    type?: string;
    skill?: string;
    status?: string;
    creatorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projects: ProjectRecord[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const conditions: string[] = ['p.deleted_at IS NULL'];
    const sqlParams: unknown[] = [];
    let idx = 1;

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

    // Projects with creator info
    sqlParams.push(limit);
    sqlParams.push(offset);
    const rows = await query<ProjectRecord>(
      `SELECT p.id, p.creator_id, p.title, p.description, p.vision, p.type, p.status, p.art,
              p.is_discoverable, p.created_at, p.updated_at,
              u.name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar_url
       FROM projects p
       JOIN users u ON u.id = p.creator_id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      sqlParams
    );

    const populated = await Promise.all(
      rows.map(async (project) => {
        const [tags, required_skills] = await Promise.all([
          this.getProjectTags(project.id),
          this.getProjectSkills(project.id),
        ]);
        return {
          ...project,
          tags,
          required_skills,
        };
      })
    );

    return { projects: populated, total };
  }

  async getProjectById(id: string): Promise<ProjectRecord> {
    const project = await queryOne<ProjectRecord>(
      `SELECT p.id, p.creator_id, p.title, p.description, p.vision, p.type, p.status, p.art,
              p.is_discoverable, p.created_at, p.updated_at,
              u.name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar_url
       FROM projects p
       JOIN users u ON u.id = p.creator_id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const [tags, required_skills, members] = await Promise.all([
      this.getProjectTags(id),
      this.getProjectSkills(id),
      this.getProjectMembers(id),
    ]);

    return {
      ...project,
      tags,
      required_skills,
      members,
    };
  }

  async createProject(creatorId: string, input: CreateProjectInput): Promise<ProjectRecord> {
    return withTransaction(async (client) => {
      const pRes = await client.query<ProjectRecord>(
        `INSERT INTO projects (creator_id, title, description, vision, type, status, art, is_discoverable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
    }).then(async (newProj) => this.getProjectById(newProj.id));
  }

  async updateProject(
    projectId: string,
    userId: string,
    input: UpdateProjectInput
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
    }).then(async () => this.getProjectById(projectId));
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

  async addMember(
    projectId: string,
    ownerId: string,
    targetUserId: string,
    role: 'owner' | 'collaborator' | 'invited' = 'invited'
  ): Promise<void> {
    const project = await queryOne<ProjectRecord>(
      `SELECT id, creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    if (project.creator_id !== ownerId) {
      throw new ForbiddenError('Only the project owner can invite or add members');
    }

    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [projectId, targetUserId, role]
    );
  }

  async removeMember(projectId: string, requesterId: string, targetUserId: string): Promise<void> {
    const project = await queryOne<ProjectRecord>(
      `SELECT id, creator_id FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId]
    );
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Requester can leave or owner can remove any non-owner member
    if (requesterId !== targetUserId && project.creator_id !== requesterId) {
      throw new ForbiddenError('You cannot remove this member');
    }

    if (targetUserId === project.creator_id) {
      throw new BadRequestError('Project owner cannot be removed from project');
    }

    await query(`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, [
      projectId,
      targetUserId,
    ]);
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
}

export const projectsService = new ProjectsService();
