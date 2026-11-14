import { describe, it, expect } from "vitest";
import request from "supertest";
import { booleanString, envSchema, parseEnv } from "../config/env";
import { createApp } from "../app";

describe("Environment Variable & Release Validation", () => {
  describe("Boolean String Parser", () => {
    it("parses valid true strings case-insensitively with trimming", () => {
      expect(booleanString.parse("true")).toBe(true);
      expect(booleanString.parse("TRUE")).toBe(true);
      expect(booleanString.parse(" True ")).toBe(true);
      expect(booleanString.parse(true)).toBe(true);
    });

    it("parses valid false strings case-insensitively with trimming", () => {
      expect(booleanString.parse("false")).toBe(false);
      expect(booleanString.parse("FALSE")).toBe(false);
      expect(booleanString.parse(" False ")).toBe(false);
      expect(booleanString.parse(false)).toBe(false);
    });

    it("rejects invalid boolean strings like yes, 1, 0, random", () => {
      expect(() => booleanString.parse("yes")).toThrow();
      expect(() => booleanString.parse("1")).toThrow();
      expect(() => booleanString.parse("0")).toThrow();
      expect(() => booleanString.parse("no")).toThrow();
      expect(() => booleanString.parse("invalid")).toThrow();
    });
  });

  describe("Release Schema Invariants", () => {
    const baseEnv = {
      JWT_ACCESS_SECRET: "a".repeat(32),
      JWT_REFRESH_SECRET: "b".repeat(32),
      CORS_ORIGINS: "http://localhost:5173",
      ANDROID_VERSION_CODE: 2,
      ANDROID_MIN_VERSION_CODE: 1,
      ANDROID_APK_URL: "https://example.com/app.apk",
      ANDROID_UPDATE_MANDATORY: "false",
    };

    it("accepts valid release config when minVersionCode <= versionCode", () => {
      const result = envSchema.safeParse(baseEnv);
      expect(result.success).toBe(true);
    });

    it("rejects release config when minVersionCode > versionCode", () => {
      const invalid = {
        ...baseEnv,
        ANDROID_VERSION_CODE: 1,
        ANDROID_MIN_VERSION_CODE: 2,
      };
      const result = envSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes("ANDROID_MIN_VERSION_CODE cannot be greater"),
          ),
        ).toBe(true);
      }
    });

    it("rejects invalid APK URL", () => {
      const invalid = {
        ...baseEnv,
        ANDROID_APK_URL: "not-a-valid-url",
      };
      const result = envSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects JWT secrets shorter than 32 characters", () => {
      const invalid = {
        ...baseEnv,
        JWT_ACCESS_SECRET: "too_short",
      };
      const result = envSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Release API Endpoints", () => {
    const app = createApp();

    it("GET /api/v1/releases/android returns release metadata", async () => {
      const res = await request(app).get("/api/v1/releases/android");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.versionName).toBe("string");
      expect(typeof res.body.data.versionCode).toBe("number");
      expect(typeof res.body.data.minVersionCode).toBe("number");
      expect(typeof res.body.data.mandatory).toBe("boolean");
    });

    it("GET /api/v1/releases/web returns web release info", async () => {
      const res = await request(app).get("/api/v1/releases/web");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.version).toBe("string");
    });

    it("Health check /health returns status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
