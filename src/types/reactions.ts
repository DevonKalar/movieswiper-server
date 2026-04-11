import type { MovieReaction } from "@/generated/prisma/client.js";

export type CreateReactionsResponse = {
  reactions: MovieReaction[];
};
