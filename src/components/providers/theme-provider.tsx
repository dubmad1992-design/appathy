"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "system" | "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: Theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return theme;
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("appathy-theme") as Theme | null;
    const nextTheme = stored ?? "system";
    setThemeState(nextTheme);
    document.documentElement.classList.toggle("dark", resolveTheme(nextTheme) === "dark");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme(nextTheme: Theme) {
        setThemeState(nextTheme);
        window.localStorage.setItem("appathy-theme", nextTheme);
        document.documentElement.classList.toggle("dark", resolveTheme(nextTheme) === "dark");
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
