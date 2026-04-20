import { z } from 'zod';

export const OpenActionSchema = z.enum(['terminal', 'claude']);
export type OpenAction = z.infer<typeof OpenActionSchema>;

export const OpenRequestSchema = z.object({
  action: OpenActionSchema,
  path: z
    .string()
    .refine((p) => !p.includes('..') && !p.startsWith('/'), 'Invalid path'),
});
export type OpenRequest = z.infer<typeof OpenRequestSchema>;
