"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type MarketMode = "GLOBAL" | "DOMESTIC";

interface MarketModeContextType {
  marketMode: MarketMode;
  setMarketMode: (mode: MarketMode) => void;
  toggleMarketMode: () => void;
}

const MarketModeContext = createContext<MarketModeContextType | undefined>(undefined);

export function MarketModeProvider({ children }: { children: React.ReactNode }) {
  const [marketMode, setMarketMode] = useState<MarketMode>("GLOBAL");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("app_market_mode");
    if (stored === "GLOBAL" || stored === "DOMESTIC") {
      setMarketMode(stored as MarketMode);
    }
  }, []);

  const handleSetMode = (mode: MarketMode) => {
    setMarketMode(mode);
    localStorage.setItem("app_market_mode", mode);
  };

  const toggleMarketMode = () => {
    const newMode = marketMode === "GLOBAL" ? "DOMESTIC" : "GLOBAL";
    handleSetMode(newMode);
  };

  return (
    <MarketModeContext.Provider value={{ marketMode, setMarketMode: handleSetMode, toggleMarketMode }}>
      {children}
    </MarketModeContext.Provider>
  );
}

export function useMarketMode() {
  const context = useContext(MarketModeContext);
  if (context === undefined) {
    throw new Error('useMarketMode must be used within a MarketModeProvider');
  }
  return context;
}
