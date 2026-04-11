import prisma from "@/lib/prisma.js";
import { NotFoundError } from "@middleware/errorHandler.js";
import type { Reaction } from "@/generated/prisma/client.js";
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

export async function updateReaction(userId: string, id: number, reaction: Reaction) {
  const existing = await prisma.movieReaction.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new NotFoundError("Reaction not found");
  }

  return await prisma.movieReaction.update({
    where: { id },
    data: { reaction },
  });
}

export async function deleteReaction(userId: string, id: number) {
  const reaction = await prisma.movieReaction.findFirst({
    where: { id, userId },
  });

  if (!reaction) {
    throw new NotFoundError("Reaction not found");
  }

  await prisma.movieReaction.delete({ where: { id } });
}
