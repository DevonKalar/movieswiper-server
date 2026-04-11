import prisma from "@/lib/prisma.js";

export async function createView(userId: string, movieId: number) {
  return await prisma.movieView.create({
    data: { userId, movieId },
  });
}
