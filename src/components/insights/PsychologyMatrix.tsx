"use client";

import React, { useMemo } from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TradeDoc } from '@/lib/firebase/schema';

interface PsychologyMatrixProps {
  trades: TradeDoc[];
  currency?: "USD" | "INR";
}

export const PsychologyMatrix: React.FC<PsychologyMatrixProps> = ({ trades, currency = "USD" }) => {
  const { activeTier } = useTierAccess();
  
  // Define locks
  const isEmotionUnlocked = activeTier === 'pro' || activeTier === 'elite';
  const isSetupUnlocked = activeTier === 'elite';

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const { emotionData, setupData } = useMemo(() => {
    const emotionMap: Record<string, number> = {};
    const setupMap: Record<string, number> = {};

    trades.forEach(t => {
      const pnl = t.profit_loss || 0;
      
      if (t.emotion) {
        emotionMap[t.emotion] = (emotionMap[t.emotion] || 0) + pnl;
      }
      if (t.setup_grade) {
        setupMap[t.setup_grade] = (setupMap[t.setup_grade] || 0) + pnl;
      }
    });

    const sortMap = (map: Record<string, number>) => {
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    return {
      emotionData: sortMap(emotionMap),
      setupData: sortMap(setupMap)
    };
  }, [trades]);

  if (!trades || trades.length === 0) {
    return (
      <div className="w-full h-48 bg-surface border border-default rounded-2xl flex items-center justify-center text-muted">
        No trades with psychological tags found.
      </div>
    );
  }

  const renderList = (data: [string, number][], title: string, isLocked: boolean, tierRequired: string) => {
    return (
      <div className="relative flex-1 bg-surface border border-default rounded-2xl p-5 flex flex-col group min-h-[300px]">
        {/* Title */}
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          {title === 'Emotion' ? <i className="las la-brain text-lg"></i> : <i className="las la-chess-knight text-lg"></i>}
          Net P&L by {title}
        </h3>

        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl transition-all duration-300">
            <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-surface/50 border border-white/10 flex items-center justify-center shadow-2xl">
                <i className="las la-lock text-2xl text-primary/80"></i>
              </div>
              <span className="text-xs font-bold text-primary/90 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                {tierRequired} Tier Required
              </span>
              <p className="text-xs text-primary/60 max-w-[200px]">
                Upgrade to reveal your most profitable {title.toLowerCase()}s.
              </p>
            </div>
          </div>
        )}

        {/* Data List */}
        <div className={`flex-1 overflow-y-auto pr-2 space-y-3 ${isLocked ? 'opacity-30 filter blur-[4px] pointer-events-none' : ''}`}>
          {data.length === 0 ? (
            <div className="text-center text-sm text-muted py-10">No {title.toLowerCase()} tags applied yet.</div>
          ) : (
            data.map(([key, pnl]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-elevated/50 rounded-xl border border-subtle">
                <span className="text-sm font-bold text-primary">{key}</span>
                <span className={`text-sm font-black font-mono ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {renderList(emotionData, "Emotion", !isEmotionUnlocked, "Pro")}
      {renderList(setupData, "Setup Grade", !isSetupUnlocked, "Elite")}
    </div>
  );
};
