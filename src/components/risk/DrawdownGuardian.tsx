import React from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { Button } from '@/components/ui/Button';

interface GuardianProps {
  accountBalance: number;
  highestEquity: number;
  currentFloatingLoss: number;
  dailyLossLimit: number; // e.g., 5%
  isTrailing: boolean;
}

export const DrawdownGuardian = ({ accountBalance, highestEquity, currentFloatingLoss, dailyLossLimit, isTrailing }: GuardianProps) => {
  const { propFirmGuardian } = useTierAccess();

  if (!propFirmGuardian) {
    return (
      <div className="rounded-xl border border-slate-200 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="text-slate-900 dark:text-slate-100 font-semibold mb-2">Prop Firm Guardian Locked</h4>
            <p className="text-xs text-slate-500 mb-4">Track trailing vs static drawdown and get real-time breach alerts.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href='/checkout/pro'}>Unlock Guardian</Button>
        </div>
        {/* Basic Risk UI underneath */}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Risk Status</h3>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">${accountBalance}</div>
      </div>
    );
  }

  const baseForCalculation = isTrailing ? highestEquity : accountBalance;
  const maxLossAllowed = baseForCalculation * (dailyLossLimit / 100);
  const remainingDrawdown = maxLossAllowed - Math.abs(currentFloatingLoss);
  
  const isDanger = remainingDrawdown < (maxLossAllowed * 0.1); // Within 10% of blowing the limit

  return (
    <div className={`rounded-xl border p-6 shadow-sm transition-colors ${isDanger ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-800 dark:bg-slate-900'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Guardian Active</h3>
        {isDanger && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
           <p className="text-xs text-slate-500 mb-1">Remaining Drawdown</p>
           <p className={`text-xl font-bold ${isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>${remainingDrawdown.toFixed(2)}</p>
        </div>
        <div>
           <p className="text-xs text-slate-500 mb-1">Limit Type</p>
           <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{isTrailing ? 'Peak Equity (Trailing)' : 'Static Balance'}</p>
        </div>
      </div>
    </div>
  );
};
