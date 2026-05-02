import * as z from 'zod';

export const createViewSchema = z.object({
    movieId: z.number().int().positive(),
});

export type CreateViewInput = z.infer<typeof createViewSchema>;
