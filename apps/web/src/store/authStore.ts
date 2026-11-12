import { create } from "zustand";
import { User, AuthTokens } from "@notes/shared";
import { apiClient } from "../lib/api/client";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: User, tokens: AuthTokens) => {
    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
    set({ user, tokens, isAuthenticated: true, isLoading: false });
  },

  updateUser: (updatedFields: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const newUser = { ...current, ...updatedFields };
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    set({ user: newUser });
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_tokens");
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  initializeAuth: async () => {
    try {
      const userStr = localStorage.getItem("auth_user");
      const tokensStr = localStorage.getItem("auth_tokens");

      if (userStr && tokensStr) {
        const user = JSON.parse(userStr);
        const tokens = JSON.parse(tokensStr);
        set({ user, tokens, isAuthenticated: true, isLoading: false });

        // Verify with /auth/me in background
        apiClient
          .get("/auth/me")
          .then((res) => {
            if (res.data.success) {
              set({ user: res.data.data });
              localStorage.setItem("auth_user", JSON.stringify(res.data.data));
            }
          })
          .catch(() => {
            // let refresh interceptor handle or keep local
          });
      } else {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
