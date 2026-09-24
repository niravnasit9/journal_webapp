import React from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  isLocked: boolean;
  requiredTier: string;
  checkoutPath: string;
  children: React.ReactNode;
}

export function LockedOverlay({ isLocked, requiredTier, checkoutPath, children }: Props) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      {/* The actual content behind the blur */}
      <div className="opacity-40 select-none pointer-events-none blur-sm transition-all duration-300">
        {children}
      </div>

      {/* The overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white/20 dark:bg-black/20 backdrop-blur-md">
        <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center mb-4 shadow-xl">
          <i className="las la-lock text-2xl text-white dark:text-slate-900"></i>
        </div>
        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{requiredTier} Tier Required</h4>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 max-w-sm">
          Unlock advanced risk metrics, automated broker syncing, and real-time behavioral insights to protect your capital.
        </p>
        <Button onClick={() => window.location.href = checkoutPath} className="px-8 font-bold">
          Upgrade to {requiredTier}
        </Button>
      </div>
    </div>
  );
}
