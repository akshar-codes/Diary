import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Menu,
  X,
  User,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore, Theme } from "../../store/themeStore";

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Diary", to: "/diary", icon: BookOpen },
    { name: "Notes", to: "/notes", icon: FileText },
    { name: "Settings", to: "/settings", icon: Settings },
  ];

  const cycleTheme = () => {
    const next: Record<Theme, Theme> = {
      light: "dark",
      dark: "system",
      system: "light",
    };
    setTheme(next[theme]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Desktop Minimal Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 select-none">
        {/* App Title */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-sm">
              J
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none text-zinc-900 dark:text-zinc-100">
                Journal
              </h1>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Diary & Notes
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Footer Actions */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Theme</span>
            <button
              onClick={cycleTheme}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title={`Current: ${theme}. Click to switch.`}
            >
              {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === "dark" && <Moon className="w-4 h-4 text-indigo-400" />}
              {theme === "system" && (
                <Laptop className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>

          {/* User profile card */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
            J
          </div>
          <span className="font-semibold text-sm">Journal</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
            {theme === "dark" && <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === "system" && <Laptop className="w-4 h-4 text-zinc-400" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-xs pt-14">
          <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-500 font-medium py-1 px-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
};
