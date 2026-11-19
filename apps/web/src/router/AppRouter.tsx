import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Layout } from "../components/common/Layout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { VerifyEmailSentPage } from "../features/auth/pages/VerifyEmailSentPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { OAuthCallbackPage } from "../features/auth/pages/OAuthCallbackPage";
import { DiaryPage } from "../features/diary/pages/DiaryPage";
import { NotesPage } from "../features/notes/pages/NotesPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { LandingPage } from "../features/landing/pages/LandingPage";
import { useWebUpdateCheck } from "../hooks/useWebUpdateCheck";
import { UpdateBanner } from "../components/common/UpdateBanner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400 text-xs">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400 text-xs">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/diary" replace />;
  }

  return <>{children}</>;
}

export const AppRouter: React.FC = () => {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const { updateAvailable, updateInfo, activateUpdate } = useWebUpdateCheck();
  const [dismissedUpdate, setDismissedUpdate] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      {updateAvailable && !dismissedUpdate && (
        <UpdateBanner
          version={updateInfo?.version}
          releaseNotes={updateInfo?.releaseNotes}
          onUpdate={activateUpdate}
          onDismiss={() => setDismissedUpdate(true)}
        />
      )}

      <Routes>
        {/* Public Landing & Distribution Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Authentication routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email-sent"
          element={
            <PublicRoute>
              <VerifyEmailSentPage />
            </PublicRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Legacy Bookmark Redirects preserving direct navigation */}
        <Route path="/diary" element={<Navigate to="/app/diary" replace />} />
        <Route path="/notes" element={<Navigate to="/app/notes" replace />} />
        <Route
          path="/settings"
          element={<Navigate to="/app/settings" replace />}
        />

        {/* Protected application workspace */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/diary" replace />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
