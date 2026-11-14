import { Router } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/android", (_req, res) => {
  res.json({
    success: true,
    data: {
      versionName: env.ANDROID_VERSION_NAME,
      versionCode: env.ANDROID_VERSION_CODE,
      minVersionCode: env.ANDROID_MIN_VERSION_CODE,
      apkUrl:
        env.ANDROID_APK_URL && env.ANDROID_APK_URL.length > 0
          ? env.ANDROID_APK_URL
          : null,
      releaseNotes: env.ANDROID_RELEASE_NOTES,
      mandatory: env.ANDROID_UPDATE_MANDATORY,
      releaseDate: env.ANDROID_RELEASE_DATE || null,
    },
  });
});

router.get("/web", (_req, res) => {
  res.json({
    success: true,
    data: {
      version: env.WEB_VERSION,
      releaseNotes: env.WEB_RELEASE_NOTES,
      releaseDate: env.WEB_RELEASE_DATE || null,
    },
  });
});

export default router;
