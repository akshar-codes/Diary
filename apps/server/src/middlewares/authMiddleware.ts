import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Missing or malformed token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    if (!payload.userId) {
      res.status(401).json({ success: false, error: "Invalid token payload." });
      return;
    }
    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: "Invalid authentication token",
    });
  }
}
