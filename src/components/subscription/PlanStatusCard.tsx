"use client";

import { useAuth } from "@/lib/firebase/authContext";
import { useSubscriptionExpiry } from "@/hooks/useSubscriptionExpiry";

export const PlanStatusCard = () => {
  const { userDoc } = useAuth();
  const { totalDurationDays, daysRemaining, elapsedPercentage, isExpired, isLifetime } = useSubscriptionExpiry(userDoc);

  if (!userDoc || !userDoc.subscription_tier || userDoc.subscription_tier === 'free') {
    return null;
  }

  const planName = userDoc.subscription_tier.charAt(0).toUpperCase() + userDoc.subscription_tier.slice(1);
  const expiresAt = userDoc.plan_expires_at ? new Date(userDoc.plan_expires_at).toLocaleDateString() : "Never";

  return (
    <div className="premium-card p-4 mb-6 border-blue-900/30 bg-blue-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
          <i className="las la-gem text-xl"></i>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Active Plan</h3>
          <span className="text-[10px] text-secondary font-medium">
            {isLifetime ? 'One-time purchase' : 'Subscription billing'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-widest border border-blue-500/30 whitespace-nowrap">
          {planName}
        </div>
        
        <div className="hidden sm:block w-px h-8 bg-neutral-800"></div>

        {isLifetime ? (
          <div className="text-emerald-400 font-bold text-sm tracking-wide whitespace-nowrap flex items-center gap-2">
            <i className="las la-infinity text-xl"></i> Lifetime Access
          </div>
        ) : (
          <div className="flex-1 md:w-48 space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-secondary">Duration</span>
              <span className={isExpired ? "text-red-400 font-bold" : "text-white font-bold"}>
                {isExpired ? "Expired" : `${daysRemaining} Days Left`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden border border-strong/50">
              <div 
                className={`h-full transition-all duration-1000 ${isExpired ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, elapsedPercentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted pt-1 text-right">
              Expires: {expiresAt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
