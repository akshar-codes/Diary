import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config();

// Custom boolean-string transformer: strictly accepts "true" or "false" (case-insensitive)
export const booleanString = z.union([
  z.boolean(),
  z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(["true", "false"]))
    .transform((val) => val === "true"),
]);

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    MONGO_URI: z
      .string()
      .default("mongodb://127.0.0.1:27017/personal_diary_notes"),

    // Strict secrets: minimum 32 characters
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters")
      .default("diary_notes_jwt_access_secret_token_key_change_in_production"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
      .default("diary_notes_jwt_refresh_secret_token_key_change_in_production"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // Exact CORS origins, comma-separated (e.g. "http://localhost:5173,https://yourapp.vercel.app")
    CORS_ORIGINS: z
      .string()
      .default(process.env.CORS_ORIGIN || "http://localhost:5173"),
    UPLOAD_DIR: z.string().default(path.join(process.cwd(), "uploads")),
    TRASH_RETENTION_DAYS: z.coerce.number().default(30),

    // Cloudinary for durable attachment storage (optional in dev, used in production if provided)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Android Release Configuration
    ANDROID_VERSION_NAME: z.string().trim().min(1).default("1.0.0"),
    ANDROID_VERSION_CODE: z.coerce.number().int().positive().default(1),
    ANDROID_MIN_VERSION_CODE: z.coerce.number().int().positive().default(1),
    ANDROID_APK_URL: z
      .string()
      .trim()
      .url("ANDROID_APK_URL must be a valid URL")
      .optional()
      .or(z.literal("")),
    ANDROID_RELEASE_NOTES: z
      .string()
      .trim()
      .default("Bug fixes and stability improvements."),
    ANDROID_RELEASE_DATE: z.string().trim().optional(), // Static ISO string or omitted
    ANDROID_UPDATE_MANDATORY: booleanString.default(false),

    // Web Release Configuration
    WEB_VERSION: z.string().trim().min(1).default("1.0.0"),
    WEB_RELEASE_NOTES: z.string().trim().default(""),
    WEB_RELEASE_DATE: z.string().trim().optional(),
  })
  .refine(
    (data) => data.ANDROID_MIN_VERSION_CODE <= data.ANDROID_VERSION_CODE,
    {
      message:
        "ANDROID_MIN_VERSION_CODE cannot be greater than ANDROID_VERSION_CODE",
      path: ["ANDROID_MIN_VERSION_CODE"],
    },
  );

export function parseEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const envToParse = {
    ...rawEnv,
    CORS_ORIGINS:
      rawEnv.CORS_ORIGINS || rawEnv.CORS_ORIGIN || "http://localhost:5173",
  };
  return envSchema.safeParse(envToParse);
}

const parsedEnv = parseEnv(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsedEnv.error.format(), null, 2),
  );
  process.exit(1);
}

export const env = parsedEnv.data;
