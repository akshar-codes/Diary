import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Palette,
  Database,
  Trash2,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useThemeStore, Theme } from "../../../store/themeStore";
import { apiClient } from "../../../lib/api/client";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { SessionInfo } from "@notes/shared";

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Backup / restore
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await apiClient.get("/auth/sessions");
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      alert("Failed to revoke session.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);

    try {
      const res = await apiClient.patch("/users/profile", { name, email });
      if (res.data.success) {
        updateUser(res.data.data);
        setProfileMsg({
          type: "success",
          text: "Profile updated successfully.",
        });
      }
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to update profile.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordLoading(true);

    try {
      const res = await apiClient.patch("/users/password", {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        setPasswordMsg({
          type: "success",
          text: "Password changed successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to change password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await apiClient.get("/users/export");
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notes-diary-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export backup data.");
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoring(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await apiClient.post("/users/restore", parsed);
      if (res.data.success) {
        setRestoreMsg(
          "Data restored successfully! Refresh to see imported entries.",
        );
      }
    } catch {
      alert("Invalid backup file format.");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt(
      "Are you absolutely sure? This will permanently delete all your diary entries, topic pages, notes, and attachments. Type DELETE to confirm:",
    );
    if (confirmText === "DELETE") {
      try {
        await apiClient.delete("/users/account");
        await logout();
        window.location.href = "/login";
      } catch {
        alert("Failed to delete account.");
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-8 pb-12">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Settings
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your account, preferences, security, and personal data
          </p>
        </div>

        {/* 1. Profile Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <User className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Personal Profile
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileMsg && (
              <div
                className={`p-3 text-xs rounded-lg ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={profileLoading}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </div>

        {/* 2. Appearance Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Palette className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Appearance
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Laptop },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id as Theme)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Privacy & Security */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Shield className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Security & Password
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMsg && (
              <div
                className={`p-3 text-xs rounded-lg ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                helperText="Min. 6 characters"
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={passwordLoading}
              >
                Change Password
              </Button>
            </div>
          </form>

          {/* Active Sessions list */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Active Sessions
            </h4>
            <div className="space-y-2">
              {sessionsLoading ? (
                <p className="text-xs text-zinc-400">Loading sessions...</p>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {sess.userAgent?.includes("Mozilla")
                            ? "Web Browser"
                            : sess.userAgent || "Device"}
                        </span>
                        {sess.isCurrent && (
                          <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Active {new Date(sess.lastActiveAt).toLocaleString()}
                      </p>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. Data Management: Backup & Export */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Database className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Data Management & Backup
            </h3>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Your personal diary entries and notes are completely yours. Export a
            full JSON backup or restore from a previous backup file at any time.
          </p>

          {restoreMsg && (
            <div className="p-3 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              {restoreMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download Backup (JSON)</span>
            </Button>

            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors">
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>
                  {restoring ? "Restoring..." : "Restore from Backup"}
                </span>
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
                disabled={restoring}
              />
            </label>
          </div>
        </div>

        {/* 5. Danger Zone: Delete Account */}
        <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-200 dark:border-rose-900/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            Danger Zone
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Permanently remove your account and all diary entries, topic pages,
            and notes. This action is irreversible.
          </p>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete Account</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
