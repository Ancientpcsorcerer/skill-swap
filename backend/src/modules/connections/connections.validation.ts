import { z } from 'zod';

export const sendConnectionSchema = z.object({
  addresseeId: z.string().uuid('Invalid user ID format'),
});
