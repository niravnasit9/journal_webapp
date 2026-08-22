"use client";

import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";

interface UpgradeCelebrationProps {
  tier: string | null;
  children: React.ReactNode;
}

const TIER_LEVELS: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

export default function UpgradeCelebration({ tier, children }: UpgradeCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const previousTierRef = useRef<string | null>(tier);

  useEffect(() => {
    // Do nothing until the initial tier is loaded from Firebase
    if (tier === null) return;

    const prev = previousTierRef.current;

    // Only animate if there was a previously loaded tier, it changed, and it's an upgrade
    if (prev !== null && prev !== tier && (TIER_LEVELS[tier] || 0) > (TIER_LEVELS[prev] || 0)) {
      setIsAnimating(true);
      
      // Fire Confetti Sequence
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Reset animation state
      setTimeout(() => setIsAnimating(false), 4000);
    }
    
    previousTierRef.current = tier;
  }, [tier]);

  return (
    <div className={`relative inline-block transition-all duration-1000 ease-out ${isAnimating ? 'scale-125 z-50' : 'scale-100 z-auto'}`}>
      
      {/* Glow Effects during animation */}
      <div 
        className={`absolute -inset-4 bg-gradient-to-r from-indigo-500 via-emerald-500 to-purple-500 rounded-lg blur-xl transition-all duration-1000 ease-out z-[-2]
          ${isAnimating ? 'opacity-70 scale-150 animate-pulse' : 'opacity-0 scale-50'}`} 
      />
      
      {/* Sparkle overlay */}
      <div 
        className={`absolute inset-0 bg-white mix-blend-overlay rounded transition-all duration-1000 ease-out z-[-1]
          ${isAnimating ? 'opacity-80' : 'opacity-0'}`} 
      />

      {/* The actual Tier Badge Text */}
      <div className={`relative transition-all duration-1000 ease-out ${isAnimating ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}`}>
        {children}
      </div>

    </div>
  );
}
