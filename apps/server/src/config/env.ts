import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGO_URI: z
    .string()
    .default("mongodb://127.0.0.1:27017/personal_diary_notes"),
  JWT_ACCESS_SECRET: z
    .string()
    .default("diary_notes_jwt_access_secret_key_default"),
  JWT_REFRESH_SECRET: z
    .string()
    .default("diary_notes_jwt_refresh_secret_key_default"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default(path.join(process.cwd(), "uploads")),
  TRASH_RETENTION_DAYS: z.coerce.number().default(30),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
