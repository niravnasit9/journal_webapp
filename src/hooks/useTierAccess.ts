"use client";

import { useAuth } from "@/lib/firebase/authContext";
import { TIER_PERMISSIONS, TierPermissions } from "@/lib/pricingConfig";
import { useMemo } from "react";

const OWNER_EMAILS = ['admin@profitpulse.com', 'developer@profitpulse.com']; // Replace with actual emails

export function useTierAccess() {
  const { user, role, tier } = useAuth();

  const isBypassed = useMemo(() => {
    if (!user) return false;
    if (role === 'admin') return true;
    if (user.email && OWNER_EMAILS.includes(user.email.toLowerCase())) return true;
    return false;
  }, [user, role]);

  const activeTierKey = useMemo(() => {
    if (isBypassed) return 'elite';
    return tier ? tier.toLowerCase() : 'free';
  }, [isBypassed, tier]);

  const permissions: TierPermissions = useMemo(() => {
    return TIER_PERMISSIONS[activeTierKey] || TIER_PERMISSIONS['free'];
  }, [activeTierKey]);

  const hasReachedLimit = (currentCount: number, limitKey: keyof TierPermissions) => {
    const limit = permissions[limitKey];
    if (typeof limit === 'number') {
      return currentCount >= limit;
    }
    return false;
  };

  return {
    ...permissions, // Spreads boolean flags and limits: maxStrategies, autoBrokerSync, etc.
    isBypassed,
    activeTierKey,
    hasReachedLimit,
    
    // Explicit booleans for clarity
    canUseAiSentiment: permissions.aiTradeSentiment,
    canBacktest: permissions.backtestingEngine,
    canAutoSync: permissions.autoBrokerSync,
    canUploadVideos: permissions.videoUploads !== 'none',
  };
}
