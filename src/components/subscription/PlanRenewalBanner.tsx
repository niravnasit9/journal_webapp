"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { useSubscriptionExpiry } from "@/hooks/useSubscriptionExpiry";

export const PlanRenewalBanner = () => {
  const { userDoc } = useAuth();
  const { isExpiringSoon, daysRemaining } = useSubscriptionExpiry(userDoc);

  if (!isExpiringSoon || !userDoc) return null;

  const planName = userDoc.subscription_tier 
    ? userDoc.subscription_tier.charAt(0).toUpperCase() + userDoc.subscription_tier.slice(1) 
    : "Premium";

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-3 text-center text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-2">
        <i className="las la-exclamation-triangle text-lg"></i>
        <span>
          ⚠️ Your {planName} plan expires in <strong className="text-white">{daysRemaining} days</strong>. Renew now to keep full access to your analytics.
        </span>
      </div>
      <Link href="/pricing" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1 rounded-md transition-colors text-xs uppercase tracking-wider shadow-lg">
        Renew Plan
      </Link>
    </div>
  );
};
