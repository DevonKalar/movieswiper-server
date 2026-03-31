import { Router } from "express";
import type { Request, Response } from "express";
import { validateReqBody } from "@middleware/validate.js";
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  logoutSchema,
} from "@/models/auth.js";
import type {
  LoginInput,
  RegisterInput,
  RefreshInput,
  LogoutInput,
} from "@/models/auth.js";
import { requireUser } from "@middleware/auth.js";
import type {
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  CheckAuthResponse,
} from "@/types/auth.js";
import {
  authenticateUser,
  createUser,
  findUserById,
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "@/services/auth.js";

const authRouter = Router();

authRouter.post(
  "/login",
  validateReqBody(loginSchema),
  async (req: Request, res: Response<LoginResponse>) => {
    const { email, password } = req.validatedBody as LoginInput;
    const user = await authenticateUser(email, password);
    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      id: user.id,
    });
  },
);

authRouter.post(
  "/register",
  validateReqBody(registerSchema),
  async (req: Request, res: Response<RegisterResponse>) => {
    const { email, password, firstName, lastName } =
      req.validatedBody as RegisterInput;
    const user = await createUser(email, password, firstName, lastName);
    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);

    return res.status(201).json({
      message: "Registration successful",
      accessToken,
      refreshToken,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      id: user.id,
    });
  },
);

authRouter.post(
  "/refresh",
  validateReqBody(refreshSchema),
  async (req: Request, res: Response<RefreshResponse>) => {
    const { refreshToken } = req.validatedBody as RefreshInput;
    const tokens = await rotateRefreshToken(refreshToken);
    return res.status(200).json(tokens);
  },
);

authRouter.post(
  "/logout",
  validateReqBody(logoutSchema),
  async (req: Request, res: Response<LogoutResponse>) => {
    const { refreshToken } = req.validatedBody as LogoutInput;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    return res.json({ message: "Logged out successfully" });
  },
);

authRouter.get(
  "/check",
  requireUser,
  async (req: Request, res: Response<CheckAuthResponse>) => {
    const user = await findUserById(req.user!.id);
    return res.status(200).json({
      message: "User is authenticated",
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      id: user.id,
    });
  },
);

export default authRouter;
