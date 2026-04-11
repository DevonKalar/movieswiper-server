import prisma from "@/lib/prisma.js";
import type { ReactionInput } from "@models/reactions.js";

export async function upsertReactions(
  userId: string,
  reactions: ReactionInput[],
) {
  return await prisma.$transaction(
    reactions.map(({ movieId, reaction }) =>
      prisma.movieReaction.upsert({
        where: { userId_movieId: { userId, movieId } },
        update: { reaction },
        create: { userId, movieId, reaction },
      }),
    ),
  );
}
