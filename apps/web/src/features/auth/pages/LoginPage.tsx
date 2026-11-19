import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { SocialButton } from "../../../components/ui/SocialButton";
import { apiClient } from "../../../lib/api/client";
import { useAuthStore } from "../../../store/authStore";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth_failed"
      ? "Social authentication failed or was cancelled. Please try again."
      : null,
  );
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || "/api/v1";

  const handleOAuthLogin = (provider: "google" | "github") => {
    window.location.href = `${apiBase}/auth/${provider}?platform=web`;
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await apiClient.post("/auth/resend-verification", { email });
      setResendStatus(res.data.message || "Verification email resent!");
    } catch (err: any) {
      setResendStatus(
        err.response?.data?.error || "Failed to resend verification email.",
      );
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setResendStatus(null);
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.tokens);
        navigate("/app/diary");
      }
    } catch (err: any) {
      const code = err.response?.data?.details?.code;
      if (code === "EMAIL_NOT_VERIFIED") {
        setIsUnverified(true);
        setError(
          "Your email address is not verified yet. Please check your inbox.",
        );
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to log in. Please check your credentials.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 items-center justify-center font-bold text-lg shadow-sm">
            J
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sign in to access your personal journal and notes
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          {/* Social Logins */}
          <div className="space-y-2 mb-4">
            <SocialButton
              provider="google"
              onClick={() => handleOAuthLogin("google")}
            />
            <SocialButton
              provider="github"
              onClick={() => handleOAuthLogin("github")}
            />
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 uppercase tracking-wider absolute font-medium">
              or continue with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400">
                <p>{error}</p>
                {isUnverified && (
                  <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-xs font-semibold underline hover:text-rose-700 dark:hover:text-rose-300"
                    >
                      {resending ? "Sending..." : "Resend confirmation email"}
                    </button>
                    <Link
                      to={`/verify-email-sent?email=${encodeURIComponent(email)}`}
                      className="text-xs hover:underline"
                    >
                      Enter token &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}

            {resendStatus && (
              <div className="p-3 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                {resendStatus}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
