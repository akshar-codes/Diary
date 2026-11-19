import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import "./config/passport";
import { env } from "./config/env";
import apiRouter from "./routes/index";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware";
import { apiLimiter } from "./middlewares/rateLimiter";

export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const allowedOrigins = new Set(
    env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  );

  // CORS configuration with exact-origin allowlisting
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps (no origin), server-to-server, curl
        if (!origin) {
          return callback(null, true);
        }
        // Exact match against allowed origins set
        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        callback(
          new Error(`CORS policy violation: Origin '${origin}' is not allowed`),
          false,
        );
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Passport initialization
  app.use(passport.initialize());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "personal-diary-notes-api",
      timestamp: new Date().toISOString(),
    });
  });

  // API router with rate limiter
  app.use("/api/v1", apiLimiter, apiRouter);

  // 404 and Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
