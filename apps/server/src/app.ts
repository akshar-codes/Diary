import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
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

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps (no origin) and web frontend
        if (
          !origin ||
          origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1")
        ) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive for local dev & demo
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Static uploads serving
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

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
