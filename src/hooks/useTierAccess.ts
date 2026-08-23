"use client";

import { useAuth } from "@/lib/firebase/authContext";
import { TIER_PERMISSIONS, Tier } from "@/lib/pricingConfig";
import { useMemo } from "react";

const OWNER_EMAILS = ['admin@profitpulse.com', 'developer@profitpulse.com', 'admin_preview_user']; 

export const useTierAccess = () => {
  const { user, role, tier: userTier } = useAuth();

  const { isBypassed, activeTier } = useMemo(() => {
    let bypassed = false;
    let computedTier: Tier = (userTier as Tier) || 'free';

    if (
      role === 'admin' ||
      (user?.email && OWNER_EMAILS.includes(user.email.toLowerCase())) || 
      user?.uid === "admin_preview_user"
    ) {
      bypassed = true;
      computedTier = 'elite';
    }

    return { isBypassed: bypassed, activeTier: computedTier };
  }, [user, role, userTier]);

  const permissions = TIER_PERMISSIONS[activeTier] || TIER_PERMISSIONS['free'];

  const hasReachedLimit = (currentCount: number, limitKey: 'maxStrategies') => {
    return currentCount >= permissions[limitKey];
  };

  return {
    ...permissions,
    isBypassed,
    activeTier,
    activeTierKey: activeTier,
    hasReachedLimit,
    
    // Explicit booleans for legacy clarity
    canUseAiSentiment: permissions.aiTradeSentiment,
    canBacktest: permissions.backtestingEngine,
    canAutoSync: permissions.autoBrokerSync,
    canUploadVideos: permissions.videoUploads !== 'none',
  };
};
