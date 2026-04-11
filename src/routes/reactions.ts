import { Router } from "express";
import type { Request, Response } from "express";
import { validateReqBody } from "@middleware/validate.js";
import { createReactionsSchema } from "@models/reactions.js";
import type { CreateReactionsInput } from "@models/reactions.js";
import type { CreateReactionsResponse } from "@/types/reactions.js";
import { upsertReactions } from "@services/reactions.js";

const reactionsRouter = Router();

reactionsRouter.post(
  "/",
  validateReqBody(createReactionsSchema),
  async (req: Request, res: Response<CreateReactionsResponse>) => {
    const { reactions } = req.validatedBody as CreateReactionsInput;
    const result = await upsertReactions(req.user!.id, reactions);
    res.status(201).json({ reactions: result });
  },
);

export default reactionsRouter;
