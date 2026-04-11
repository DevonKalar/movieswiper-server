import * as z from "zod";

const reactionSchema = z.object({
  movieId: z.number().int().positive(),
  reaction: z.enum(["like", "reject"]),
});

export const createReactionsSchema = z.object({
  reactions: z.array(reactionSchema).min(1),
});

export type CreateReactionsInput = z.infer<typeof createReactionsSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
