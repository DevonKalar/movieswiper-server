import * as z from 'zod';

export const movieDetailsSchema = z.object({
    id: z.string().min(1),
});

export const movieQuerySchema = z.object({
    include_adult: z.enum(['true', 'false']).default('false'),
    include_video: z.enum(['true', 'false']).default('false'),
    language: z.string().default('en-US'),
    page: z.string().regex(/^\d+$/).default('1'),
    sort_by: z.string().default('popularity.desc'),
    with_genres: z.string().optional(),
});

export type MovieDetailsParams = z.infer<typeof movieDetailsSchema>;
export type MovieQuery = z.infer<typeof movieQuerySchema>;
