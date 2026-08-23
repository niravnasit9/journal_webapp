import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";

export interface RiskMetrics {
  initialBalance: number;
  currentBalance: number;
  overallPnL: number;
  highestWatermark: number;
  maxDrawdownThreshold: number;
  overallDrawdownRemaining: number;
  overallDrawdownUsedPct: number;
  isOverallBlown: boolean;
  dailyLossLimitValue: number;
  currentDailyPnL: number;
  dailyDrawdownRemaining: number;
  dailyDrawdownUsedPct: number;
  isDailyBlown: boolean;
}

export function calculateAccountRisk(account: AccountDoc, trades: TradeDoc[]): RiskMetrics {
  const initialBalance = account.initial_balance || 0;
  
  // Sort trades chronologically
  const chronologicalTrades = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
  
  const overallPnL = chronologicalTrades.reduce((acc, trade) => acc + (trade.profit_loss - (trade.commission || 0)), 0);
  const currentBalance = initialBalance + overallPnL;
  
  // Drawdown Logic Engine
  let highestWatermark = initialBalance;
  let runningBalance = initialBalance;

  chronologicalTrades.forEach(t => {
    runningBalance += (t.profit_loss - (t.commission || 0));
    if (account.drawdown_type === 'trailing') {
      if (runningBalance > highestWatermark) {
        highestWatermark = runningBalance;
      }
    }
  });

  const dailyLossLimitPct = account.daily_loss_limit_pct || 5;
  const maxDrawdownPct = account.max_drawdown_pct || 10;
  
  let maxDrawdownThreshold = 0;
  if (account.drawdown_type === 'trailing') {
    maxDrawdownThreshold = highestWatermark - (initialBalance * maxDrawdownPct) / 100;
  } else {
    maxDrawdownThreshold = initialBalance - (initialBalance * maxDrawdownPct) / 100;
  }

  const overallDrawdownRemaining = currentBalance - maxDrawdownThreshold;
  const overallDrawdownUsedPct = maxDrawdownThreshold > 0 ? ((initialBalance - currentBalance) / (initialBalance - maxDrawdownThreshold)) * 100 : 0;
  const isOverallBlown = currentBalance <= maxDrawdownThreshold;

  // Daily Drawdown threshold
  const dailyPnL: Record<string, number> = {};
  chronologicalTrades.forEach(t => {
    const dateStr = new Date(t.close_time).toISOString().split('T')[0];
    dailyPnL[dateStr] = (dailyPnL[dateStr] || 0) + (t.profit_loss - (t.commission || 0));
  });
  
  const currentDay = chronologicalTrades.length > 0 ? new Date(chronologicalTrades[chronologicalTrades.length - 1].close_time).toISOString().split('T')[0] : '';
  const currentDailyPnL = currentDay ? (dailyPnL[currentDay] || 0) : 0;
  
  // Using balance-based daily drawdown logic (end of day balance vs current balance)
  const startOfDayBalance = currentBalance - currentDailyPnL;
  const dailyLossLimitValue = (startOfDayBalance * dailyLossLimitPct) / 100;
  
  const dailyDrawdownRemaining = dailyLossLimitValue + currentDailyPnL;
  const dailyDrawdownUsedPct = dailyLossLimitValue > 0 ? (Math.max(0, -currentDailyPnL) / dailyLossLimitValue) * 100 : 0;
  const isDailyBlown = currentDailyPnL <= -dailyLossLimitValue;

  return {
    initialBalance,
    currentBalance,
    overallPnL,
    highestWatermark,
    maxDrawdownThreshold,
    overallDrawdownRemaining: Math.max(0, overallDrawdownRemaining),
    overallDrawdownUsedPct: Math.max(0, Math.min(100, overallDrawdownUsedPct)),
    isOverallBlown,
    dailyLossLimitValue,
    currentDailyPnL,
    dailyDrawdownRemaining: Math.max(0, dailyDrawdownRemaining),
    dailyDrawdownUsedPct: Math.max(0, Math.min(100, dailyDrawdownUsedPct)),
    isDailyBlown
  };
}
