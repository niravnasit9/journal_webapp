import { TradeDoc } from "./firebase/schema";

export interface CoachingAlert {
  type: 'positive' | 'warning';
  title: string;
  message: string;
}

export function generateCoachingAlerts(trades: TradeDoc[]): CoachingAlert[] {
  const alerts: CoachingAlert[] = [];
  
  if (!trades || trades.length < 5) {
    alerts.push({
      type: 'warning',
      title: 'Insufficient Data',
      message: 'Log more trades to generate AI coaching insights.'
    });
    return alerts;
  }

  const winningTrades = trades.filter(t => (t.profit_loss - (t.commission || 0)) > 0);
  const losingTrades = trades.filter(t => (t.profit_loss - (t.commission || 0)) <= 0);

  // 1. Positive: Best Setup / Emotion
  const setupStats: Record<string, { wins: number, total: number, rrSum: number }> = {};
  trades.forEach(t => {
    if (t.setup_grade) {
      if (!setupStats[t.setup_grade]) setupStats[t.setup_grade] = { wins: 0, total: 0, rrSum: 0 };
      setupStats[t.setup_grade].total++;
      if ((t.profit_loss - (t.commission || 0)) > 0) {
        setupStats[t.setup_grade].wins++;
      }
      if (t.risk_reward_ratio) {
        setupStats[t.setup_grade].rrSum += t.risk_reward_ratio;
      }
    }
  });

  let bestSetup = null;
  let bestWinRate = 0;
  for (const [setup, stats] of Object.entries(setupStats)) {
    if (stats.total >= 3) {
      const wr = stats.wins / stats.total;
      if (wr > bestWinRate && wr >= 0.5) {
        bestWinRate = wr;
        bestSetup = { setup, wr: wr * 100, avgRr: stats.rrSum / stats.total };
      }
    }
  }

  if (bestSetup) {
    alerts.push({
      type: 'positive',
      title: 'Setup Validation',
      message: `Your '${bestSetup.setup}' setup is generating a ${bestSetup.wr.toFixed(0)}% win rate${bestSetup.avgRr > 0 ? ` with a ${bestSetup.avgRr.toFixed(1)} average R:R` : ''}. Consider sizing up on this specific setup.`
    });
  }

  // 2. Negative: Day of Week Bleed
  const dayStats: Record<number, { wins: number, total: number }> = {};
  trades.forEach(t => {
    const d = new Date(t.open_time).getDay();
    if (!dayStats[d]) dayStats[d] = { wins: 0, total: 0 };
    dayStats[d].total++;
    if ((t.profit_loss - (t.commission || 0)) > 0) {
      dayStats[d].wins++;
    }
  });

  const daysOfWeek = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  let worstDay = null;
  let worstDayWinRate = 1;
  for (const [dayStr, stats] of Object.entries(dayStats)) {
    const day = parseInt(dayStr);
    if (stats.total >= 3) {
      const wr = stats.wins / stats.total;
      if (wr < 0.3 && wr < worstDayWinRate) {
        worstDayWinRate = wr;
        worstDay = { day, wr: wr * 100, total: stats.total };
      }
    }
  }

  if (worstDay) {
    alerts.push({
      type: 'warning',
      title: 'Session Drain',
      message: `You lose ${(100 - worstDay.wr).toFixed(0)}% of trades taken on ${daysOfWeek[worstDay.day]}. Cut your volume on this day to protect your capital.`
    });
  }

  // 3. Negative: Revenge Trading (consecutive losses within 15 mins)
  const sortedTrades = [...trades].sort((a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime());
  let revengeCount = 0;
  for (let i = 0; i < sortedTrades.length - 1; i++) {
    const current = sortedTrades[i];
    const next = sortedTrades[i + 1];
    
    const pnl1 = current.profit_loss - (current.commission || 0);
    const pnl2 = next.profit_loss - (next.commission || 0);

    if (pnl1 < 0 && pnl2 < 0) {
      const timeGapMins = (new Date(next.open_time).getTime() - new Date(current.close_time).getTime()) / (1000 * 60);
      if (timeGapMins >= 0 && timeGapMins <= 15) {
        revengeCount++;
      }
    }
  }

  if (revengeCount >= 2) {
    alerts.push({
      type: 'warning',
      title: 'Revenge Trading Detected',
      message: `You have entered a subsequent losing trade within 15 minutes of a previous loss ${revengeCount} times. Walk away from the screens immediately after a loss.`
    });
  }

  return alerts;
}
