import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { apiClient } from "../../../lib/api/client";
import { useAuthStore } from "../../../store/authStore";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : "No verification token provided in URL.",
  );

  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token || verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verify = async () => {
      try {
        const res = await apiClient.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
        );

        if (res.data.success && res.data.data) {
          setStatus("success");
          setAuth(res.data.data.user, res.data.data.tokens);
          setTimeout(() => {
            navigate("/app/diary", { replace: true });
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage("Failed to verify email. Please try again.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(
          err.response?.data?.error ||
            "Verification link has expired or is invalid.",
        );
      }
    };

    verify();
  }, [token, navigate, setAuth]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 items-center justify-center shadow-sm">
            J
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Account Verification
          </h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs text-center space-y-4">
          {status === "verifying" && (
            <div className="py-6 space-y-3">
              <div className="w-8 h-8 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Verifying your registration...
              </p>
              <p className="text-xs text-zinc-400">Please hold on a moment.</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email Verified Successfully!
              </h3>
              <p className="text-xs text-zinc-500">
                Redirecting you to your journal...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="py-4 space-y-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Verification Failed
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {errorMessage}
              </p>
              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Back to Sign In
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/verify-email-sent")}
                >
                  Request New Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
