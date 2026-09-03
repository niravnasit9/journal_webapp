"use client";

import { useUiStore } from "@/store/useUiStore";

export default function MarketSwitcher() {
  const { activeWorkspace, setWorkspace } = useUiStore();

  return (
    <div className="flex items-center bg-elevated rounded-full p-1 border border-default">
      <button
        onClick={() => setWorkspace("GLOBAL")}
        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
          activeWorkspace === "GLOBAL" 
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
            : "text-muted hover:text-white"
        }`}
      >
        🌍 Global
      </button>
      <button
        onClick={() => setWorkspace("DOMESTIC")}
        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
          activeWorkspace === "DOMESTIC" 
            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
            : "text-muted hover:text-white"
        }`}
      >
        🇮🇳 Domestic
      </button>
    </div>
  );
}
