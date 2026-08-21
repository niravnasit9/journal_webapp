"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

// Apply theme to DOM immediately (before React renders) to prevent flash
function applyThemeToDOM(newTheme: Theme) {
  if (newTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // 1. Apply from localStorage or system preference immediately (fast, no network)
    let localTheme = localStorage.getItem("theme") as Theme | null;
    if (!localTheme) {
      localTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
    }
    setThemeState(localTheme);
    applyThemeToDOM(localTheme);

    // 2. Then sync with Firestore in background (slower, network)
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const unsubDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists() && docSnap.data().theme) {
          const serverTheme = docSnap.data().theme as Theme;
          setThemeState(serverTheme);
          localStorage.setItem("theme", serverTheme);
          applyThemeToDOM(serverTheme);
        }
      });

      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyThemeToDOM(newTheme);
  };

  // NO hidden wrapper — render immediately, theme applied via classList on <html>
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
