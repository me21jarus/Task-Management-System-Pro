import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSettings, updateSettings } from "../lib/db";
import { logger } from "../lib/logger";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

function getSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function applyThemeToDOM(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getSystemTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      try {
        const settings = await getSettings();
        if (!cancelled) {
          const savedTheme = settings.theme || getSystemTheme();
          setThemeState(savedTheme);
          applyThemeToDOM(savedTheme);
          setIsLoaded(true);
        }
      } catch (err) {
        logger.error("Failed to load theme from IndexedDB:", err);
        if (!cancelled) {
          applyThemeToDOM(getSystemTheme());
          setIsLoaded(true);
        }
      }
    }

    loadTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply theme to DOM whenever it changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      applyThemeToDOM(theme);
    }
  }, [theme, isLoaded]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
      updateSettings({ theme: newTheme }).catch((err) => {
        logger.error("Failed to persist theme:", err);
      });
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // Apply system theme immediately to prevent flash
  if (!isLoaded) {
    applyThemeToDOM(getSystemTheme());
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
