import { Router } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/android", async (_req, res) => {
  let apkUrl = env.ANDROID_APK_URL || "";
  let latestVersion = env.ANDROID_VERSION_NAME;
  let releaseNotes = env.ANDROID_RELEASE_NOTES;
  let publishedAt = env.ANDROID_RELEASE_DATE || null;

  // Android binaries are published as APK assets on GitHub Releases. Keep the
  // existing metadata fallback so the updater still works during API outages.
  try {
    const response = await fetch(env.ANDROID_GITHUB_RELEASE_API);
    if (response.ok) {
      const release = (await response.json()) as {
        tag_name?: string;
        body?: string;
        published_at?: string;
        assets?: Array<{ name?: string; browser_download_url?: string }>;
      };
      const apk = release.assets?.find((asset) =>
        asset.name?.toLowerCase().endsWith(".apk"),
      );
      if (apk?.browser_download_url) apkUrl = apk.browser_download_url;
      if (release.tag_name) latestVersion = release.tag_name.replace(/^v/, "");
      if (release.body) releaseNotes = release.body;
      if (release.published_at) publishedAt = release.published_at;
    }
  } catch {
    // Use configured fallback metadata when GitHub cannot be reached.
  }

  res.json({
    success: true,
    data: {
      versionName: latestVersion,
      versionCode: env.ANDROID_VERSION_CODE,
      minVersionCode: env.ANDROID_MIN_VERSION_CODE,
      apkUrl: apkUrl || null,
      releaseNotes,
      mandatory: env.ANDROID_UPDATE_MANDATORY,
      releaseDate: publishedAt,
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
