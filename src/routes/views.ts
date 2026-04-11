import { Router } from "express";
import type { Request, Response } from "express";
import { validateReqBody } from "@middleware/validate.js";
import { createViewSchema } from "@models/views.js";
import type { CreateViewInput } from "@models/views.js";
import { createView } from "@services/views.js";

const viewsRouter = Router();

viewsRouter.post(
  "/",
  validateReqBody(createViewSchema),
  async (req: Request, res: Response) => {
    const { movieId } = req.validatedBody as CreateViewInput;
    const view = await createView(req.user!.id, movieId);
    res.status(201).json(view);
  },
);

export default viewsRouter;
