import { z } from 'zod';

export const createIdeaSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5),
  tags: z.array(z.string().trim()).default([]),
  art: z.string().trim().default('idea'),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5),
  tags: z.array(z.string().trim()).default([]),
  art: z.string().trim().default('event'),
  event_date: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  is_online: z.boolean().default(false),
});

export const saveItemSchema = z.object({
  itemType: z.enum(['project', 'idea', 'event']),
  itemId: z.string().min(1),
});
