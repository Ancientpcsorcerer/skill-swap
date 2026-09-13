import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  vision: z.string().trim().default(''),
  type: z.string().trim().min(1, 'Project type is required'),
  status: z.enum(['Draft', 'Ongoing', 'Completed']).default('Ongoing'),
  art: z.string().trim().default('product'),
  is_discoverable: z.boolean().default(true),
  tags: z.array(z.string().trim().min(1).max(80)).default([]),
  required_skills: z.array(z.string().trim().min(1).max(80)).default([]),
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().min(5).optional(),
  vision: z.string().trim().optional(),
  type: z.string().trim().min(1).optional(),
  status: z.enum(['Draft', 'Ongoing', 'Completed']).optional(),
  art: z.string().trim().optional(),
  is_discoverable: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(80)).optional(),
  required_skills: z.array(z.string().trim().min(1).max(80)).optional(),
});

export const searchProjectsQuerySchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  type: z.string().optional(),
  skill: z.string().optional(),
  status: z.enum(['Draft', 'Ongoing', 'Completed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['owner', 'collaborator', 'invited']).default('invited'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
