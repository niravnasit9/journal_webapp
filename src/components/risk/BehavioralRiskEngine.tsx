"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TradeDoc } from "@/lib/firebase/schema";
import { getLocalJsDate } from "@/lib/dateUtils";

interface Props {
  trades: TradeDoc[];
  currencySymbol: string;
}

export function BehavioralRiskEngine({ trades, currencySymbol }: Props) {
  // Sort trades chronologically
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
  }, [trades]);

  const insights = useMemo(() => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Tilt / Consecutive Losses Detection
    let consecutiveLosses = 0;
    let currentStreakLossAmount = 0;
    
    for (let i = sortedTrades.length - 1; i >= 0; i--) {
      if (sortedTrades[i].profit_loss < 0) {
        consecutiveLosses++;
        currentStreakLossAmount += Math.abs(sortedTrades[i].profit_loss);
      } else {
        break;
      }
    }

    if (consecutiveLosses >= 3) {
      alerts.push({
        type: 'danger',
        icon: 'las la-fire',
        title: 'High Tilt Probability',
        message: `You have taken ${consecutiveLosses} consecutive losses totaling ${currencySymbol}${currentStreakLossAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}. Step away from the screen for at least 30 minutes to reset your mental capital.`
      });
    }

    // 2. Overtrading Detection
    const todaysTrades = sortedTrades.filter(t => {
      const d = getLocalJsDate(t.close_time);
      return d && d >= today;
    });

    if (todaysTrades.length >= 5) {
      const todaysPnL = todaysTrades.reduce((acc, t) => acc + t.profit_loss, 0);
      alerts.push({
        type: todaysPnL < 0 ? 'danger' : 'warning',
        icon: 'las la-exclamation-triangle',
        title: 'Overtrading Warning',
        message: `You've executed ${todaysTrades.length} trades today. Excessive trading leads to decision fatigue and emotional execution. Quality over quantity.`
      });
    }

    // 3. Revenge Trading (Rapid execution after a loss)
    let revengeTradesCount = 0;
    for (let i = 1; i < todaysTrades.length; i++) {
      const prevTrade = todaysTrades[i - 1];
      const currTrade = todaysTrades[i];
      
      if (prevTrade.profit_loss < 0) {
        const timeDiffMinutes = (new Date(currTrade.close_time).getTime() - new Date(prevTrade.close_time).getTime()) / 60000;
        if (timeDiffMinutes < 15) { // Trade entered within 15 mins of a loss
          revengeTradesCount++;
        }
      }
    }

    if (revengeTradesCount > 0) {
      alerts.push({
        type: 'danger',
        icon: 'las la-angry',
        title: 'Revenge Trading Detected',
        message: `We detected ${revengeTradesCount} trades executed less than 15 minutes after a loss today. Immediate reentry is a classic sign of revenge trading. Enforce a 15-minute cool-down rule.`
      });
    }

    // 4. If no alerts, give positive reinforcement
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        icon: 'las la-brain',
        title: 'Peak Psychological State',
        message: "Your trading behavior is disciplined. No signs of overtrading, tilt, or revenge trading detected recently. Keep executing your edge."
      });
    }

    return alerts;
  }, [sortedTrades, currencySymbol]);

  return (
    <Card className="overflow-hidden border-default shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
      <CardHeader className="border-b border-white/10 bg-black/20 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <i className="las la-brain text-xl text-purple-400"></i>
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                Behavioral & Psychology Guard
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">Real-time analysis of your execution behavior to prevent emotional trading.</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border flex gap-4 items-start ${
                insight.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20' : 
                insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 
                'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div className={`mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                insight.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : 
                insight.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                <i className={`${insight.icon} text-lg`}></i>
              </div>
              <div>
                <h4 className={`text-sm font-bold mb-1 ${
                  insight.type === 'danger' ? 'text-rose-400' : 
                  insight.type === 'warning' ? 'text-amber-400' : 
                  'text-emerald-400'
                }`}>{insight.title}</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
