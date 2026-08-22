"use client";

import { useAuth } from "@/lib/firebase/authContext";

export function useTierTheme() {
  const { tier } = useAuth();

  switch (tier) {
    case "elite":
      return {
        card: "bg-surface border border-default rounded-xl relative overflow-hidden before:absolute before:inset-0 before:bg-[var(--plan-elite-bg)] before:opacity-20 before:pointer-events-none",
        buttonPrimary: "bg-[var(--plan-elite)] text-white hover:opacity-90 active:opacity-100 transition-all rounded-lg font-semibold flex items-center justify-center gap-2 px-4 py-2 shadow-sm",
        buttonSecondary: "bg-[var(--plan-elite-bg)] text-[var(--plan-elite)] hover:bg-[var(--plan-elite)] hover:text-white transition-all rounded-lg font-medium flex items-center justify-center gap-2 px-4 py-2",
        textHighlight: "text-[var(--plan-elite)] font-semibold",
        badge: "bg-[var(--plan-elite-bg)] text-[var(--plan-elite)] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
        alert: "bg-[var(--plan-elite-bg)] border border-[var(--plan-elite)]/20 text-[var(--plan-elite)] p-4 rounded-lg",
        icon: "text-[var(--plan-elite)]",
        border: "border-[var(--plan-elite)]/30",
        spinner: "border-[var(--plan-elite)] border-t-transparent",
        sidebarActive: "bg-[var(--plan-elite-bg)] border-l-4 border-[var(--plan-elite)] text-[var(--plan-elite)] font-medium",
      };
    case "pro":
      return {
        card: "bg-surface border border-default rounded-xl relative overflow-hidden before:absolute before:inset-0 before:bg-[var(--plan-pro-bg)] before:opacity-20 before:pointer-events-none",
        buttonPrimary: "bg-[var(--plan-pro)] text-white hover:opacity-90 active:opacity-100 transition-all rounded-lg font-semibold flex items-center justify-center gap-2 px-4 py-2 shadow-sm",
        buttonSecondary: "bg-[var(--plan-pro-bg)] text-[var(--plan-pro)] hover:bg-[var(--plan-pro)] hover:text-white transition-all rounded-lg font-medium flex items-center justify-center gap-2 px-4 py-2",
        textHighlight: "text-[var(--plan-pro)] font-semibold",
        badge: "bg-[var(--plan-pro-bg)] text-[var(--plan-pro)] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
        alert: "bg-[var(--plan-pro-bg)] border border-[var(--plan-pro)]/20 text-[var(--plan-pro)] p-4 rounded-lg",
        icon: "text-[var(--plan-pro)]",
        border: "border-[var(--plan-pro)]/30",
        spinner: "border-[var(--plan-pro)] border-t-transparent",
        sidebarActive: "bg-[var(--plan-pro-bg)] border-l-4 border-[var(--plan-pro)] text-[var(--plan-pro)] font-medium",
      };
    case "starter":
      return {
        card: "bg-surface border border-default rounded-xl relative overflow-hidden before:absolute before:inset-0 before:bg-[var(--plan-starter-bg)] before:opacity-20 before:pointer-events-none",
        buttonPrimary: "bg-[var(--plan-starter)] text-white hover:opacity-90 active:opacity-100 transition-all rounded-lg font-semibold flex items-center justify-center gap-2 px-4 py-2 shadow-sm",
        buttonSecondary: "bg-[var(--plan-starter-bg)] text-[var(--plan-starter)] hover:bg-[var(--plan-starter)] hover:text-white transition-all rounded-lg font-medium flex items-center justify-center gap-2 px-4 py-2",
        textHighlight: "text-[var(--plan-starter)] font-semibold",
        badge: "bg-[var(--plan-starter-bg)] text-[var(--plan-starter)] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
        alert: "bg-[var(--plan-starter-bg)] border border-[var(--plan-starter)]/20 text-[var(--plan-starter)] p-4 rounded-lg",
        icon: "text-[var(--plan-starter)]",
        border: "border-[var(--plan-starter)]/30",
        spinner: "border-[var(--plan-starter)] border-t-transparent",
        sidebarActive: "bg-[var(--plan-starter-bg)] border-l-4 border-[var(--plan-starter)] text-[var(--plan-starter)] font-medium",
      };
    default: // free
      return {
        card: "bg-surface border border-default rounded-xl",
        buttonPrimary: "bg-primary text-inverse hover:opacity-90 active:opacity-100 transition-all rounded-lg font-semibold flex items-center justify-center gap-2 px-4 py-2 shadow-sm",
        buttonSecondary: "bg-elevated border border-default text-primary hover:border-strong transition-all rounded-lg font-medium flex items-center justify-center gap-2 px-4 py-2",
        textHighlight: "text-primary font-semibold",
        badge: "bg-[var(--plan-free-bg)] text-[var(--plan-free)] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
        alert: "bg-elevated border border-default text-primary p-4 rounded-lg",
        icon: "text-secondary",
        border: "border-default",
        spinner: "border-primary border-t-transparent",
        sidebarActive: "bg-elevated text-primary font-medium rounded-lg mx-2",
      };
  }
}
