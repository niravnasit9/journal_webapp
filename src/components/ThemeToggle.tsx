"use client";

import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

export default function ThemeToggle({ variant = "full" }: { variant?: "full" | "icon" }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleTheme = async () => {
    if (isUpdating) return;
    
    const newTheme = theme === "dark" ? "light" : "dark";
    
    // Optimistically update UI
    setTheme(newTheme);

    if (user) {
      try {
        setIsUpdating(true);
        await updateDoc(doc(db, "users", user.uid), {
          theme: newTheme
        });
      } catch (error) {
        console.error("Error updating theme in Firestore:", error);
        // Revert on failure
        setTheme(theme);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={toggleTheme}
        disabled={isUpdating}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        title="Toggle Theme"
      >
        <div className="relative flex items-center justify-center w-5 h-5">
          <i className={`las la-sun text-xl absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}></i>
          <i className={`las la-moon text-xl absolute transition-all duration-500 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`}></i>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      disabled={isUpdating}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 w-full text-left text-sm text-secondary hover:text-primary hover:bg-elevated group disabled:opacity-50"
      title="Toggle Theme"
    >
      <div className="relative flex items-center justify-center w-6 h-6">
        <i className={`las la-sun text-xl absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100 text-yellow-500' : 'opacity-0 -rotate-90 scale-0'}`}></i>
        <i className={`las la-moon text-xl absolute transition-all duration-500 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100 text-slate-600' : 'opacity-0 rotate-90 scale-0'}`}></i>
      </div>
      <span className="font-bold">
        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}
