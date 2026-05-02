import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateReqBody, validateReqParams } from '@middleware/validate.js';
import {
    createReactionsSchema,
    reactionParamsSchema,
    updateReactionSchema,
} from '@models/reactions.js';
import type {
    CreateReactionsInput,
    ReactionParams,
    UpdateReactionInput,
} from '@models/reactions.js';
import type { CreateReactionsResponse } from '@/types/reactions.js';
import type { MovieReaction } from '@/generated/prisma/client.js';
import { upsertReactions, updateReaction, deleteReaction } from '@services/reactions.js';

const reactionsRouter = Router();

reactionsRouter.post(
    '/',
    validateReqBody(createReactionsSchema),
    async (req: Request, res: Response<CreateReactionsResponse>) => {
        const { reactions } = req.validatedBody as CreateReactionsInput;
        const result = await upsertReactions(req.user!.id, reactions);
        res.status(201).json({ reactions: result });
    },
);

reactionsRouter.patch(
    '/:id',
    validateReqParams(reactionParamsSchema),
    validateReqBody(updateReactionSchema),
    async (req: Request, res: Response<MovieReaction>) => {
        const { id } = req.validatedParams as ReactionParams;
        const { reaction } = req.validatedBody as UpdateReactionInput;
        const updated = await updateReaction(req.user!.id, id, reaction);
        res.json(updated);
    },
);

reactionsRouter.delete(
    '/:id',
    validateReqParams(reactionParamsSchema),
    async (req: Request, res: Response) => {
        const { id } = req.validatedParams as ReactionParams;
        await deleteReaction(req.user!.id, id);
        res.status(204).send();
    },
);

export default reactionsRouter;
