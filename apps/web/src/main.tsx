import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./router/AppRouter";
import { useThemeStore } from "./store/themeStore";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { theme, applyTheme } = useThemeStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ThemeInitializer>
    </QueryClientProvider>
  </React.StrictMode>,
);
