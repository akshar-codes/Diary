import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRegisterSW } from "virtual:pwa-register/react";

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const API_URL = import.meta.env.VITE_API_URL || "/api/v1";
const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 min

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}

export function useWebUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    releaseNotes: string;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Service worker update detection (PWA)
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setUpdateAvailable(true);
    },
    onOfflineReady() {},
  });

  const checkBackend = async () => {
    try {
      const res = await axios.get(`${API_URL}/releases/web`);
      if (res.data?.success && res.data?.data) {
        const { version, releaseNotes } = res.data.data;
        if (compareVersions(version, CURRENT_VERSION) > 0) {
          setUpdateAvailable(true);
          setUpdateInfo({ version, releaseNotes });
        }
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    checkBackend();
    intervalRef.current = setInterval(checkBackend, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const activateUpdate = () => {
    if (needRefresh[0]) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  return {
    updateAvailable: updateAvailable || Boolean(needRefresh[0]),
    updateInfo,
    activateUpdate,
  };
}
