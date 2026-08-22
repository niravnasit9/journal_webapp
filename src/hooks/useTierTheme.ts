"use client";

import { useAuth } from "@/lib/firebase/authContext";

export function useTierTheme() {
  const { tier } = useAuth();

  switch (tier) {
    case "elite":
      return {
        card: "bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-2xl border border-purple-500/30 dark:border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] transition-all duration-500 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-purple-500/10 before:via-fuchsia-500/5 before:to-transparent before:animate-gradient-x before:pointer-events-none rounded-[2rem]",
        buttonPrimary: "relative group overflow-hidden bg-gray-900 dark:bg-white text-white dark:text-black shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] border border-purple-500/50 hover:border-purple-400 transition-all duration-500 rounded-2xl font-black tracking-wide flex items-center justify-center gap-2 px-6 py-3 hover:-translate-y-1 active:translate-y-0.5",
        buttonSecondary: "bg-purple-500/5 hover:bg-purple-500/10 backdrop-blur-md text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 rounded-2xl font-bold flex items-center justify-center gap-2 px-6 py-3 hover:-translate-y-0.5 shadow-sm",
        textHighlight: "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 animate-gradient-x drop-shadow-sm font-black tracking-tight",
        badge: "bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] animate-pulse border border-purple-400/50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]",
        alert: "bg-purple-500/5 backdrop-blur-xl border border-purple-500/30 text-purple-900 dark:text-purple-100 shadow-[0_8px_30px_rgba(168,85,247,0.15)] p-5 rounded-2xl relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-gradient-to-b before:from-purple-500 before:to-fuchsia-500",
        icon: "text-purple-600 dark:text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse",
        border: "border-purple-500/30 dark:border-purple-500/20",
        spinner: "border-purple-500 border-t-transparent",
        sidebarActive: "bg-gradient-to-r from-purple-600/10 to-transparent border-l-4 border-purple-500 text-purple-700 dark:text-purple-300 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]",
      };
    case "pro":
      return {
        card: "bg-white/95 dark:bg-[#11110f]/95 backdrop-blur-xl border border-yellow-500/30 dark:border-yellow-500/20 shadow-[0_8px_30px_rgba(234,179,8,0.1)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.15)] transition-all duration-500 rounded-[2rem] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-yellow-500/5 before:to-transparent before:pointer-events-none",
        buttonPrimary: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_8px_20px_rgba(234,179,8,0.3)] hover:shadow-[0_12px_25px_rgba(234,179,8,0.4)] border border-yellow-400/50 hover:border-yellow-300 transition-all duration-300 rounded-2xl font-black flex items-center justify-center gap-2 px-6 py-3 hover:-translate-y-1 active:translate-y-0.5",
        buttonSecondary: "bg-yellow-500/5 hover:bg-yellow-500/10 backdrop-blur-md text-yellow-700 dark:text-yellow-500 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 rounded-2xl font-bold flex items-center justify-center gap-2 px-6 py-3 hover:-translate-y-0.5 shadow-sm",
        textHighlight: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 drop-shadow-sm font-black tracking-tight",
        badge: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_4px_10px_rgba(234,179,8,0.3)] border border-yellow-300/50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]",
        alert: "bg-yellow-500/5 backdrop-blur-xl border border-yellow-500/30 text-yellow-900 dark:text-yellow-100 shadow-[0_8px_30px_rgba(234,179,8,0.1)] p-5 rounded-2xl relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-yellow-500",
        icon: "text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]",
        border: "border-yellow-500/30 dark:border-yellow-500/20",
        spinner: "border-yellow-500 border-t-transparent",
        sidebarActive: "bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-500 shadow-[inset_0_0_15px_rgba(234,179,8,0.05)]",
      };
    case "starter":
      return {
        card: "bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-lg border border-blue-500/20 dark:border-blue-500/10 shadow-[0_4px_20px_rgba(59,130,246,0.05)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-500 rounded-[1.5rem]",
        buttonPrimary: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(59,130,246,0.25)] border border-blue-500/30 transition-all duration-300 rounded-xl font-bold flex items-center justify-center gap-2 px-5 py-2.5 hover:-translate-y-0.5 active:translate-y-0",
        buttonSecondary: "bg-blue-50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-all duration-300 rounded-xl font-semibold flex items-center justify-center gap-2 px-5 py-2.5",
        textHighlight: "text-blue-600 dark:text-blue-400 font-bold",
        badge: "bg-blue-500 text-white shadow-sm px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
        alert: "bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl border-l-4 border-l-blue-500",
        icon: "text-blue-500",
        border: "border-blue-200 dark:border-blue-500/20",
        spinner: "border-blue-500 border-t-transparent",
        sidebarActive: "bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400",
      };
    default: // free
      return {
        card: "bg-white dark:bg-[#13141a] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 rounded-[1.5rem]",
        buttonPrimary: "bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black shadow-sm transition-all duration-200 rounded-xl font-bold flex items-center justify-center gap-2 px-5 py-2.5 active:scale-95",
        buttonSecondary: "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-all duration-200 rounded-xl font-medium flex items-center justify-center gap-2 px-5 py-2.5",
        textHighlight: "text-gray-900 dark:text-white font-bold",
        badge: "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
        alert: "bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 p-4 rounded-xl",
        icon: "text-gray-500 dark:text-gray-400",
        border: "border-gray-200 dark:border-gray-800",
        spinner: "border-gray-900 dark:border-white border-t-transparent",
        sidebarActive: "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold rounded-xl mx-2",
      };
  }
}
