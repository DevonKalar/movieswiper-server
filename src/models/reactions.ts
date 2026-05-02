import * as z from 'zod';

const reactionSchema = z.object({
    movieId: z.number().int().positive(),
    reaction: z.enum(['like', 'reject']),
});

export const createReactionsSchema = z.object({
    reactions: z.array(reactionSchema).min(1),
});

export const reactionParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const updateReactionSchema = z.object({
    reaction: z.enum(['like', 'reject']),
});

export type CreateReactionsInput = z.infer<typeof createReactionsSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type ReactionParams = z.infer<typeof reactionParamsSchema>;
export type UpdateReactionInput = z.infer<typeof updateReactionSchema>;
