"use client";

import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

export default function ThemeToggle() {
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

  return (
    <button
      onClick={toggleTheme}
      disabled={isUpdating}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-[#fafafa] dark:hover:bg-[#1a1d24] group disabled:opacity-50"
      title="Toggle Theme"
    >
      <div className="relative flex items-center justify-center w-6 h-6">
        <i className={`las la-moon text-xl absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100 text-blue-400' : 'opacity-0 -rotate-90 scale-0'}`}></i>
        <i className={`las la-sun text-xl absolute transition-all duration-500 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100 text-yellow-500' : 'opacity-0 rotate-90 scale-0'}`}></i>
      </div>
      <span className="font-bold">
        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}
