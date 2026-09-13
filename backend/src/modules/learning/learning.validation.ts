import { z } from 'zod';

export const updateLearningRecordSchema = z.object({
  status: z.enum(['In Progress', 'Saved', 'Completed']),
  progress: z.number().int().min(0).max(100),
});

export const addLearningGoalSchema = z.object({
  goal: z.string().trim().min(2, 'Goal must be at least 2 characters').max(160, 'Goal cannot exceed 160 characters'),
});
