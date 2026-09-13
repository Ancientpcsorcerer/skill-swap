import { query, queryOne, withTransaction } from '../../db/client';
import { NotFoundError } from '../../utils/errors';
import { UserRecord } from '../auth/auth.service';

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  location?: string;
  avatar_url?: string | null;
  skills?: string[];
  interests?: string[];
  project_interests?: string[];
}

export class UsersService {
  async getProfile(userId: string): Promise<UserRecord> {
    const user = await queryOne<UserRecord>(
      `SELECT id, name, username, email, bio, location, avatar_url, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [skills, interests, projectInterests] = await Promise.all([
      this.getUserSkills(userId),
      this.getUserInterests(userId),
      this.getUserProjectInterests(userId),
    ]);

    return {
      ...user,
      skills,
      interests,
      project_interests: projectInterests,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserRecord> {
    return withTransaction(async (client) => {
      // 1. Update basic user info
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (input.name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(input.name);
      }
      if (input.bio !== undefined) {
        updates.push(`bio = $${idx++}`);
        values.push(input.bio);
      }
      if (input.location !== undefined) {
        updates.push(`location = $${idx++}`);
        values.push(input.location);
      }
      if (input.avatar_url !== undefined) {
        updates.push(`avatar_url = $${idx++}`);
        values.push(input.avatar_url);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(userId);
        await client.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`,
          values
        );
      }

      // 2. Replace skills if specified
      if (input.skills !== undefined) {
        await client.query(`DELETE FROM user_skills WHERE user_id = $1`, [userId]);
        for (const skill of input.skills) {
          const cleanSkill = skill.trim();
          if (cleanSkill) {
            await client.query(
              `INSERT INTO user_skills (user_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [userId, cleanSkill]
            );
          }
        }
      }

      // 3. Replace interests if specified
      if (input.interests !== undefined) {
        await client.query(`DELETE FROM user_interests WHERE user_id = $1`, [userId]);
        for (const interest of input.interests) {
          const cleanInterest = interest.trim();
          if (cleanInterest) {
            await client.query(
              `INSERT INTO user_interests (user_id, interest) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [userId, cleanInterest]
            );
          }
        }
      }

      // 4. Replace project interests if specified
      if (input.project_interests !== undefined) {
        await client.query(`DELETE FROM user_project_interests WHERE user_id = $1`, [userId]);
        for (const topic of input.project_interests) {
          const cleanTopic = topic.trim();
          if (cleanTopic) {
            await client.query(
              `INSERT INTO user_project_interests (user_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [userId, cleanTopic]
            );
          }
        }
      }

      const userRes = await client.query<UserRecord>(
        `SELECT id, name, username, email, bio, location, avatar_url, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );

      const user = userRes.rows[0];
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    }).then(async (updatedUser) => {
      const [skills, interests, projectInterests] = await Promise.all([
        this.getUserSkills(userId),
        this.getUserInterests(userId),
        this.getUserProjectInterests(userId),
      ]);
      return {
        ...updatedUser,
        skills,
        interests,
        project_interests: projectInterests,
      };
    });
  }

  async getUserById(id: string): Promise<UserRecord> {
    const user = await queryOne<UserRecord>(
      `SELECT id, name, username, bio, location, avatar_url, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [skills, interests, projectInterests] = await Promise.all([
      this.getUserSkills(id),
      this.getUserInterests(id),
      this.getUserProjectInterests(id),
    ]);

    return {
      ...user,
      skills,
      interests,
      project_interests: projectInterests,
    };
  }

  async searchUsers(
    queryStr?: string,
    skillFilter?: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: UserRecord[]; total: number }> {
    const conditions: string[] = ['u.deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    if (queryStr && queryStr.trim()) {
      params.push(`%${queryStr.trim()}%`);
      conditions.push(`(u.name ILIKE $${idx} OR u.username ILIKE $${idx} OR u.bio ILIKE $${idx})`);
      idx++;
    }

    if (skillFilter && skillFilter.trim()) {
      params.push(`%${skillFilter.trim()}%`);
      conditions.push(
        `EXISTS (SELECT 1 FROM user_skills us WHERE us.user_id = u.id AND us.skill ILIKE $${idx})`
      );
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const countRes = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM users u WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes?.count || '0', 10);

    // Results
    params.push(limit);
    params.push(offset);
    const rows = await query<UserRecord>(
      `SELECT u.id, u.name, u.username, u.bio, u.location, u.avatar_url, u.created_at, u.updated_at
       FROM users u
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    // Populate skills for returned users
    const usersWithSkills = await Promise.all(
      rows.map(async (u) => {
        const skills = await this.getUserSkills(u.id);
        return {
          ...u,
          skills,
        };
      })
    );

    return { users: usersWithSkills, total };
  }

  async getSuggestedUsers(currentUserId: string, limit = 10): Promise<UserRecord[]> {
    const rows = await query<UserRecord>(
      `SELECT u.id, u.name, u.username, u.bio, u.location, u.avatar_url, u.created_at, u.updated_at
       FROM users u
       WHERE u.id <> $1
         AND u.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM connections c
           WHERE (c.requester_id = $1 AND c.addressee_id = u.id)
              OR (c.requester_id = u.id AND c.addressee_id = $1)
         )
       ORDER BY u.created_at DESC
       LIMIT $2`,
      [currentUserId, limit]
    );

    return Promise.all(
      rows.map(async (u) => {
        const [skills, interests] = await Promise.all([
          this.getUserSkills(u.id),
          this.getUserInterests(u.id),
        ]);
        return {
          ...u,
          skills,
          interests,
        };
      })
    );
  }

  private async getUserSkills(userId: string): Promise<string[]> {
    const rows = await query<{ skill: string }>(
      `SELECT skill FROM user_skills WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => r.skill);
  }

  private async getUserInterests(userId: string): Promise<string[]> {
    const rows = await query<{ interest: string }>(
      `SELECT interest FROM user_interests WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => r.interest);
  }

  private async getUserProjectInterests(userId: string): Promise<string[]> {
    const rows = await query<{ topic: string }>(
      `SELECT topic FROM user_project_interests WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => r.topic);
  }
}

export const usersService = new UsersService();
