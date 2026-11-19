import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../../lib/api/client";
import { useAuthStore } from "../../../store/authStore";

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const oauthError = searchParams.get("error");

    if (oauthError || !accessToken || !refreshToken) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    const completeAuth = async () => {
      try {
        const tokens = { accessToken, refreshToken };
        localStorage.setItem("auth_tokens", JSON.stringify(tokens));

        // Fetch user profile with token
        const res = await apiClient.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.data.success && res.data.data) {
          setAuth(res.data.data, tokens);
          navigate("/app/diary", { replace: true });
        } else {
          throw new Error("Failed to load user profile");
        }
      } catch (err: any) {
        localStorage.removeItem("auth_tokens");
        setError("Failed to finalize social sign-in. Redirecting...");
        setTimeout(() => {
          navigate("/login?error=oauth_failed", { replace: true });
        }, 1500);
      }
    };

    completeAuth();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 items-center justify-center shadow-sm">
          J
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Completing sign-in...
          </h2>
          <p className="text-xs text-zinc-500">
            {error || "Setting up your workspace"}
          </p>
        </div>
      </div>
    </div>
  );
};
