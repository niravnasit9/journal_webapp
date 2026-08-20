"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type FontType = "geist" | "inter" | "outfit" | "space-grotesk";

interface FontContextType {
  currentFont: FontType;
  setFont: (font: FontType) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [currentFont, setCurrentFont] = useState<FontType>("geist");

  useEffect(() => {
    const savedFont = localStorage.getItem("preferred-font") as FontType;
    if (savedFont && ["geist", "inter", "outfit", "space-grotesk"].includes(savedFont)) {
      setCurrentFont(savedFont);
    }
  }, []);

  const setFont = (font: FontType) => {
    setCurrentFont(font);
    localStorage.setItem("preferred-font", font);
  };

  return (
    <FontContext.Provider value={{ currentFont, setFont }}>
      <div data-font={currentFont} className={`font-active-${currentFont} h-full`}>
        {children}
      </div>
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}
