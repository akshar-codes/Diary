import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { authLimiter } from "../middlewares/rateLimiter";
import { registerSchema, loginSchema, refreshTokenSchema } from "@notes/shared";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  AuthController.register,
);
router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh", validate(refreshTokenSchema), AuthController.refresh);
router.post("/logout", requireAuth, AuthController.logout);
router.get("/me", requireAuth, AuthController.getMe);
router.get("/sessions", requireAuth, AuthController.getSessions);
router.delete("/sessions/:id", requireAuth, AuthController.revokeSession);

export default router;
