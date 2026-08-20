"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from local storage immediately to prevent flicker
    const localTheme = localStorage.getItem("theme") as Theme | null;
    if (localTheme) {
      applyTheme(localTheme);
    } else {
      // Default to light theme if no local storage
      applyTheme("light");
    }

    // Listen to Firebase auth to fetch server-side preference
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Listen to live updates from the user's doc
        const unsubDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().theme) {
            applyTheme(docSnap.data().theme as Theme);
          }
        });
        return () => unsubDoc();
      }
    });

    return () => unsubscribe();
  }, []);

  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch flicker
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
