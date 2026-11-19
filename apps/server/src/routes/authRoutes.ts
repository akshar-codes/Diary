import { Router, Request, Response, NextFunction } from "express";
import { AuthController } from "../controllers/authController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { authLimiter } from "../middlewares/rateLimiter";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resendVerificationSchema,
} from "@notes/shared";
import passport, {
  isGoogleOAuthConfigured,
  isGithubOAuthConfigured,
} from "../config/passport";
import { env } from "../config/env";

const router = Router();

// --- Email / Password Authentication ---
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  AuthController.register,
);

router.get("/verify-email", AuthController.verifyEmail);
router.post("/verify-email", AuthController.verifyEmail);

router.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  AuthController.resendVerification,
);

router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh", validate(refreshTokenSchema), AuthController.refresh);
router.post("/logout", requireAuth, AuthController.logout);
router.get("/me", requireAuth, AuthController.getMe);
router.get("/sessions", requireAuth, AuthController.getSessions);
router.delete("/sessions/:id", requireAuth, AuthController.revokeSession);

// --- OAuth 2.0 (Google & GitHub) ---

// Fallback for OAuth authentication failure
router.get("/oauth-failed", (req: Request, res: Response) => {
  const platform = (req.query.platform as string) || "web";
  if (platform === "android") {
    res.redirect("diaryapp://oauth/callback?error=oauth_failed");
    return;
  }
  res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
});

// Google OAuth
router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleOAuthConfigured) {
    res.status(503).json({
      success: false,
      error:
        "Google OAuth is not configured on this server. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.",
    });
    return;
  }
  const platform = (req.query.platform as string) || "web";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: platform,
    session: false,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    const platform = (req.query.state as string) || "web";
    passport.authenticate("google", {
      session: false,
      failureRedirect: `/api/v1/auth/oauth-failed?platform=${encodeURIComponent(platform)}`,
    })(req, res, next);
  },
  AuthController.oauthCallback,
);

// GitHub OAuth
router.get("/github", (req: Request, res: Response, next: NextFunction) => {
  if (!isGithubOAuthConfigured) {
    res.status(503).json({
      success: false,
      error:
        "GitHub OAuth is not configured on this server. Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.",
    });
    return;
  }
  const platform = (req.query.platform as string) || "web";
  passport.authenticate("github", {
    scope: ["user:email"],
    state: platform,
    session: false,
  })(req, res, next);
});

router.get(
  "/github/callback",
  (req: Request, res: Response, next: NextFunction) => {
    const platform = (req.query.state as string) || "web";
    passport.authenticate("github", {
      session: false,
      failureRedirect: `/api/v1/auth/oauth-failed?platform=${encodeURIComponent(platform)}`,
    })(req, res, next);
  },
  AuthController.oauthCallback,
);

export default router;
