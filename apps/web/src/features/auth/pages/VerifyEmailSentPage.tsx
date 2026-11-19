import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { apiClient } from "../../../lib/api/client";

export const VerifyEmailSentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState("");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setError("Please specify your email address.");
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiClient.post("/auth/resend-verification", { email });
      setMessage(res.data.message || "A new verification email has been sent!");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to resend verification email.",
      );
    } finally {
      setResending(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    navigate(`/verify-email?token=${encodeURIComponent(token.trim())}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 items-center justify-center shadow-sm">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Check your email
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We sent a verification link and token to{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {email || "your address"}
            </span>
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
          {message && (
            <div className="p-3 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Click the confirmation link inside the email to activate your
            account and automatically sign in. The link expires in 24 hours.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full text-xs"
              onClick={handleResend}
              isLoading={resending}
            >
              Resend verification email
            </Button>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 uppercase tracking-wider absolute font-medium">
              or enter token manually
            </span>
          </div>

          <form onSubmit={handleManualTokenSubmit} className="space-y-3">
            <Input
              label="Registration Token"
              placeholder="Paste token from email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!token.trim()}
            >
              Verify Token &rarr;
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already verified or wrong email?{" "}
          <Link
            to="/login"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
