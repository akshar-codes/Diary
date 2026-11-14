import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Monitor,
  Download,
  ArrowRight,
  PlusSquare,
  Smartphone,
  Shield,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { usePwaInstall } from "../../../hooks/usePwaInstall";
import { apiClient } from "../../../lib/api/client";

export const LandingPage: React.FC = () => {
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string | null>(null);
  const [androidVersion, setAndroidVersion] = useState<string | null>(null);
  const [isLoadingRelease, setIsLoadingRelease] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/releases/android")
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.data) {
          if (res.data.data.apkUrl) {
            setApkDownloadUrl(res.data.data.apkUrl);
          }
          if (res.data.data.versionName) {
            setAndroidVersion(res.data.data.versionName);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (isMounted) setIsLoadingRelease(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-amber-200 dark:selection:bg-amber-900">
      {/* Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center font-bold text-base shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              Journal & Notes
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Private Diary & Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors shadow-xs"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Cross-platform personal diary & standalone notes</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl text-zinc-900 dark:text-zinc-50 leading-tight">
          Reflect daily. Organize clearly.{" "}
          <span className="text-zinc-400 dark:text-zinc-500">
            Available everywhere.
          </span>
        </h2>

        <p className="mt-4 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          Record daily thoughts with linked topic pages, maintain standalone
          categorized notes, and keep your data seamlessly synchronized across
          web browsers and Android.
        </p>

        {/* 3 Main Experience Cards */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1: Web Interface */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-4">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Web Application
              </h3>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Access your journal immediately in any desktop or mobile
                browser. Full-featured diary editor, markdown notes, calendar,
                and session management.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
              >
                <span>Open Web App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/register"
                className="text-center text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1 transition-colors"
              >
                Create a new account
              </Link>
            </div>
          </div>

          {/* Card 2: Progressive Web App */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-4">
                <PlusSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Install Web App (PWA)
              </h3>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Install directly to your home screen or desktop. Launches in a
                clean standalone window with instant application-shell loading
                and verified private caching policies.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              {isInstalled ? (
                <div className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/40">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>App Already Installed</span>
                </div>
              ) : canInstall ? (
                <button
                  onClick={install}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors cursor-pointer"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>Install Web App</span>
                </button>
              ) : (
                <div className="text-center py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>
                    To install, open in Chrome or Edge and click "Install" in
                    the browser bar, or "Add to Home Screen" on iOS.
                  </span>
                </div>
              )}
              <span className="text-center text-[10px] text-zinc-400 mt-1">
                Zero app store friction
              </span>
            </div>
          </div>

          {/* Card 3: Native Android APK */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Native Android App
              </h3>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Pure native Java Android application powered by Retrofit and
                Android Keystore-backed secure token storage. Sideloadable APK
                with in-app update checks.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              {isLoadingRelease ? (
                <div className="py-2.5 text-center text-xs text-zinc-400">
                  Checking release...
                </div>
              ) : apkDownloadUrl ? (
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Download APK {androidVersion ? `(v${androidVersion})` : ""}
                  </span>
                </a>
              ) : (
                <div className="text-center py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>APK release URL will appear here once published.</span>
                </div>
              )}
              <span className="text-center text-[10px] text-zinc-400 mt-1">
                Direct sideload · Requires Android 8.0+
              </span>
            </div>
          </div>
        </div>

        {/* Security & Privacy Guarantee */}
        <div className="mt-16 p-6 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 max-w-2xl w-full flex items-start gap-4 text-left">
          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs shrink-0">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Private by Design
            </h4>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your entries and notes are tied solely to your authenticated
              account. The Service Worker adheres to a strict NetworkOnly policy
              for all private user content so sensitive data is never cached in
              unencrypted browser storage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 px-6 text-center text-xs text-zinc-400">
        <p>Personal Diary & Notes Monorepo · Production Deployment Ready</p>
      </footer>
    </div>
  );
};
