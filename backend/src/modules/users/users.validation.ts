import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(80)).optional(),
  interests: z.array(z.string().trim().min(1).max(80)).optional(),
  project_interests: z.array(z.string().trim().min(1).max(80)).optional(),
});

export const searchUsersQuerySchema = z.object({
  q: z.string().optional(),
  skill: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
