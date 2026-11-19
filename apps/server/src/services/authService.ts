import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { UserModel, IUser } from "../models/User";
import { SessionModel } from "../models/Session";
import { AppError } from "../middlewares/errorMiddleware";
import { EmailService } from "./emailService";
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  AuthTokens,
  User,
  RegisterPendingResponse,
} from "@notes/shared";

function generateTokens(userId: string, sessionId: string): AuthTokens {
  const accessToken = jwt.sign({ userId, sessionId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId, sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
}

function parseExpiryToDate(expiresInStr: string): Date {
  const d = new Date();
  if (expiresInStr.endsWith("d")) {
    d.setDate(d.getDate() + parseInt(expiresInStr, 10));
  } else if (expiresInStr.endsWith("h")) {
    d.setHours(d.getHours() + parseInt(expiresInStr, 10));
  } else {
    d.setDate(d.getDate() + 7);
  }
  return d;
}

export class AuthService {
  static async register(
    input: RegisterInput,
  ): Promise<RegisterPendingResponse> {
    const email = input.email.toLowerCase();
    const existing = await UserModel.findOne({ email });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (existing) {
      if (existing.emailVerified) {
        throw new AppError(
          "An account with this email address already exists.",
          409,
        );
      }

      // If user exists but is unverified, update name/password and issue fresh token
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      existing.name = input.name;
      existing.passwordHash = passwordHash;
      existing.emailVerifyToken = hashedToken;
      existing.emailVerifyExpires = expires;
      await existing.save();

      await EmailService.sendVerificationEmail(
        existing.email,
        existing.name,
        rawToken,
      );

      return {
        emailSent: true,
        message: "Verification email sent. Please check your inbox.",
        email: existing.email,
      };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await UserModel.create({
      name: input.name,
      email,
      passwordHash,
      provider: "email",
      emailVerified: false,
      emailVerifyToken: hashedToken,
      emailVerifyExpires: expires,
    });

    await EmailService.sendVerificationEmail(user.email, user.name, rawToken);

    return {
      emailSent: true,
      message:
        "Verification email sent. Please check your inbox to confirm your account.",
      email: user.email,
    };
  }

  static async verifyEmail(
    token: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    if (!token || typeof token !== "string") {
      throw new AppError("Verification token is required.", 400);
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    // Look for matching token that hasn't expired
    const user = await UserModel.findOne({
      $or: [
        { emailVerifyToken: hashedToken },
        { emailVerifyToken: token.trim() },
      ],
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError(
        "Invalid or expired verification token. Please request a new verification email.",
        400,
      );
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    // Create active session immediately after verification
    const sessionId = new Types.ObjectId();
    const tokens = generateTokens(user._id.toString(), sessionId.toString());
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await SessionModel.create({
      _id: sessionId,
      userId: user._id,
      refreshTokenHash,
      userAgent,
      ipAddress,
      provider: user.provider || "email",
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    });

    return {
      user: user.toJSON() as unknown as User,
      tokens,
    };
  }

  static async resendVerification(
    email: string,
  ): Promise<{ emailSent: boolean; message: string }> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError("No account found with this email address.", 404);
    }

    if (user.emailVerified) {
      throw new AppError(
        "This account is already verified. Please sign in.",
        400,
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.emailVerifyToken = hashedToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await EmailService.sendVerificationEmail(user.email, user.name, rawToken);

    return {
      emailSent: true,
      message:
        "A new verification email has been sent. Please check your inbox.",
    };
  }

  static async login(
    input: LoginInput,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const user = await UserModel.findOne({
      email: input.email.toLowerCase(),
    }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (!user.emailVerified) {
      throw new AppError(
        "Please verify your email address before signing in. Check your inbox for the verification link.",
        403,
        {
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
        },
      );
    }

    const sessionId = new Types.ObjectId();
    const tokens = generateTokens(user._id.toString(), sessionId.toString());
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await SessionModel.create({
      _id: sessionId,
      userId: user._id,
      refreshTokenHash,
      userAgent,
      ipAddress,
      provider: user.provider || "email",
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    });

    return {
      user: user.toJSON() as unknown as User,
      tokens,
    };
  }

  static async createOAuthSession(
    user: IUser,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const sessionId = new Types.ObjectId();
    const tokens = generateTokens(user._id.toString(), sessionId.toString());
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await SessionModel.create({
      _id: sessionId,
      userId: user._id,
      refreshTokenHash,
      userAgent,
      ipAddress,
      provider: user.provider || "google",
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    });

    return {
      user: user.toJSON() as unknown as User,
      tokens,
    };
  }

  static async refreshToken(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        sessionId: string;
      };

      const session = await SessionModel.findById(payload.sessionId).select(
        "+refreshTokenHash",
      );
      if (!session) {
        throw new AppError("Session expired or revoked.", 401);
      }

      const isValid = await bcrypt.compare(
        oldRefreshToken,
        session.refreshTokenHash,
      );
      if (!isValid) {
        // Potential token reuse attack - revoke session immediately
        await SessionModel.findByIdAndDelete(payload.sessionId);
        throw new AppError(
          "Invalid refresh token. Session revoked for security.",
          401,
        );
      }

      // Rotate tokens
      const newTokens = generateTokens(payload.userId, payload.sessionId);
      const newRefreshHash = await bcrypt.hash(newTokens.refreshToken, 10);

      session.refreshTokenHash = newRefreshHash;
      session.lastActiveAt = new Date();
      if (userAgent) session.userAgent = userAgent;
      if (ipAddress) session.ipAddress = ipAddress;
      await session.save();

      return newTokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Invalid or expired refresh token.", 401);
    }
  }

  static async logout(sessionId: string): Promise<void> {
    await SessionModel.findByIdAndDelete(sessionId);
  }

  static async getUserById(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user.toJSON() as unknown as User;
  }

  static async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await SessionModel.find({ userId }).sort({
      lastActiveAt: -1,
    });
    return sessions.map((s) => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      userAgent: s.userAgent || "Unknown Device",
      ipAddress: s.ipAddress || "Unknown IP",
      lastActiveAt: s.lastActiveAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      isCurrent: s._id.toString() === currentSessionId,
    }));
  }

  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await SessionModel.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new AppError("Session not found.", 404);
    }
    await SessionModel.findByIdAndDelete(sessionId);
  }
}
