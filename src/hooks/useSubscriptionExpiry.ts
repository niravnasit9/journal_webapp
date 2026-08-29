import { useMemo } from 'react';
import { UserDoc } from '@/lib/firebase/schema';

interface SubscriptionMetrics {
  totalDurationDays: number;
  daysRemaining: number;
  elapsedPercentage: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  isLifetime: boolean;
}

export const useSubscriptionExpiry = (user: UserDoc | null | undefined): SubscriptionMetrics => {
  return useMemo(() => {
    // Default fallback for missing data or non-expiring Free accounts
    const defaultMetrics: SubscriptionMetrics = {
      totalDurationDays: 0,
      daysRemaining: Infinity,
      elapsedPercentage: 0,
      isExpiringSoon: false,
      isExpired: false,
      isLifetime: true, // If no expiry date is set, consider it lifetime
    };

    if (!user || !user.plan_expires_at) {
      return defaultMetrics;
    }

    const now = new Date().getTime();
    const expiresAt = new Date(user.plan_expires_at).getTime();

    // Treat dates far in the future (e.g. > 10 years from now) as lifetime
    const isLifetime = expiresAt > now + 10 * 365 * 24 * 60 * 60 * 1000;
    if (isLifetime) {
      return { ...defaultMetrics, isLifetime: true, daysRemaining: Infinity };
    }
    
    // If started_at is missing, fallback to duration or just compute elapsed based on duration
    const startedAt = user.plan_started_at 
      ? new Date(user.plan_started_at).getTime() 
      : expiresAt - ((user.plan_duration_days || 30) * 24 * 60 * 60 * 1000);

    const totalDurationMs = expiresAt - startedAt;
    const totalDurationDays = Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24));
    
    const remainingMs = expiresAt - now;
    const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    const elapsedMs = Math.max(0, now - startedAt);
    let elapsedPercentage = totalDurationMs > 0 ? (elapsedMs / totalDurationMs) * 100 : 0;
    elapsedPercentage = Math.min(100, Math.max(0, elapsedPercentage));

    const isExpired = daysRemaining <= 0;
    const isExpiringSoon = !isExpired && daysRemaining <= 7;

    return {
      totalDurationDays,
      daysRemaining,
      elapsedPercentage,
      isExpiringSoon,
      isExpired,
      isLifetime,
    };
  }, [user]);
};
