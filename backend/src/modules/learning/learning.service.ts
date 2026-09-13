import { query, queryOne } from '../../db/client';
import { NotFoundError } from '../../utils/errors';

export interface LearningRecord {
  id: string;
  user_id: string;
  path_id: string;
  status: 'In Progress' | 'Saved' | 'Completed';
  progress: number;
  updated_at: string;
}

export interface LearningGoal {
  id: string;
  user_id: string;
  goal: string;
  created_at: string;
}

export class LearningService {
  async getLearningState(userId: string): Promise<{
    records: LearningRecord[];
    goals: LearningGoal[];
  }> {
    const [records, goals] = await Promise.all([
      query<LearningRecord>(
        `SELECT id, user_id, path_id, status, progress, updated_at
         FROM learning_records
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [userId]
      ),
      query<LearningGoal>(
        `SELECT id, user_id, goal, created_at
         FROM learning_goals
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [userId]
      ),
    ]);

    return { records, goals };
  }

  async updateRecord(
    userId: string,
    pathId: string,
    status: 'In Progress' | 'Saved' | 'Completed',
    progress: number
  ): Promise<LearningRecord> {
    const row = await queryOne<LearningRecord>(
      `INSERT INTO learning_records (user_id, path_id, status, progress, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, path_id)
       DO UPDATE SET status = EXCLUDED.status, progress = EXCLUDED.progress, updated_at = NOW()
       RETURNING id, user_id, path_id, status, progress, updated_at`,
      [userId, pathId, status, progress]
    );

    return row!;
  }

  async addGoal(userId: string, goal: string): Promise<LearningGoal> {
    const row = await queryOne<LearningGoal>(
      `INSERT INTO learning_goals (user_id, goal)
       VALUES ($1, $2)
       RETURNING id, user_id, goal, created_at`,
      [userId, goal]
    );

    return row!;
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const existing = await queryOne<LearningGoal>(
      `SELECT id, user_id FROM learning_goals WHERE id = $1`,
      [goalId]
    );

    if (!existing || existing.user_id !== userId) {
      throw new NotFoundError('Goal not found');
    }

    await query(`DELETE FROM learning_goals WHERE id = $1`, [goalId]);
  }
}

export const learningService = new LearningService();
