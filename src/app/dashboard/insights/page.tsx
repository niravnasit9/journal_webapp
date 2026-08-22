"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function InsightsPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTrades();
  }, [user]);

  const fetchTrades = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch user accounts
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      
      let allTrades: TradeDoc[] = [];
      for (const accDoc of accSnap.docs) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", accDoc.id));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        allTrades = [...allTrades, ...tDocs];
      }
      setTrades(allTrades);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  if (trades.length < 10) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-lightbulb text-3xl text-warning"></i>
            Trading Insights
          </h1>
          <p className="text-secondary text-sm mt-1">Data-driven analysis of your trading habits.</p>
        </div>
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4 border border-default">
            <i className="las la-chart-bar text-3xl text-muted"></i>
          </div>
          <h3 className="text-lg font-bold text-primary">Not Enough Data</h3>
          <p className="text-secondary text-sm mt-2 max-w-md">
            We need more trading data to generate accurate insights. Record at least 10 trades to unlock this feature.
          </p>
          <div className="mt-6 text-sm font-bold text-primary">
            Current Trades: {trades.length} / 10
          </div>
        </Card>
      </div>
    );
  }

  const getInsightValue = (record: Record<string, number>, highest: boolean) => {
    let targetKey = "N/A";
    let targetVal = highest ? -Infinity : Infinity;
    
    for (const [key, val] of Object.entries(record)) {
      if (highest && val > targetVal) {
        targetVal = val;
        targetKey = key;
      } else if (!highest && val < targetVal) {
        targetVal = val;
        targetKey = key;
      }
    }
    return { key: targetKey, val: targetVal === -Infinity || targetVal === Infinity ? 0 : targetVal };
  };

  const instruments: Record<string, number> = {};
  const strategies: Record<string, number> = {};
  const sessions: Record<string, number> = {};
  const weekdays: Record<string, number> = {};
  const setups: Record<string, number> = {}; // using strategy_tag + direction
  
  let totalWinPnL = 0;
  let totalWins = 0;
  let totalLossPnL = 0;
  let totalLosses = 0;

  trades.forEach(t => {
    const pnl = t.profit_loss - (t.commission || 0);
    const day = new Date(t.close_time).toLocaleDateString('en-US', { weekday: 'long' });
    
    instruments[t.symbol] = (instruments[t.symbol] || 0) + pnl;
    
    if (t.strategy_tag) {
      strategies[t.strategy_tag] = (strategies[t.strategy_tag] || 0) + pnl;
      const setupKey = `${t.strategy_tag} (${t.direction})`;
      setups[setupKey] = (setups[setupKey] || 0) + pnl;
    }
    
    weekdays[day] = (weekdays[day] || 0) + pnl;
    
    // Simplistic Session mapping based on UTC hour (just an example, normally would be saved explicitly)
    const hour = new Date(t.open_time).getUTCHours();
    let session = "Other";
    if (hour >= 1 && hour < 8) session = "Tokyo";
    else if (hour >= 8 && hour < 13) session = "London";
    else if (hour >= 13 && hour < 21) session = "New York";
    else if (hour >= 21 || hour < 1) session = "Sydney";
    
    sessions[session] = (sessions[session] || 0) + pnl;

    if (pnl > 0) {
      totalWinPnL += pnl;
      totalWins++;
    } else if (pnl < 0) {
      totalLossPnL += pnl;
      totalLosses++;
    }
  });

  const bestInst = getInsightValue(instruments, true);
  const worstInst = getInsightValue(instruments, false);
  const bestStrat = getInsightValue(strategies, true);
  const worstStrat = getInsightValue(strategies, false);
  const bestDay = getInsightValue(weekdays, true);
  const worstDay = getInsightValue(weekdays, false);
  const bestSession = getInsightValue(sessions, true);
  const worstSession = getInsightValue(sessions, false);
  const bestSetup = getInsightValue(setups, true);
  const worstSetup = getInsightValue(setups, false);

  const avgWin = totalWins > 0 ? totalWinPnL / totalWins : 0;
  const avgLoss = totalLosses > 0 ? Math.abs(totalLossPnL / totalLosses) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
          <i className="las la-lightbulb text-3xl text-warning"></i>
          Trading Insights
        </h1>
        <p className="text-secondary text-sm mt-1">Data-driven analysis of your trading habits across {trades.length} trades.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Instruments */}
        <Card className="overflow-hidden border-default shadow-sm">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-3">
            <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <i className="las la-chart-pie text-lg text-primary"></i>
              Instruments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-secondary font-medium mb-1">Best Performing</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{bestInst.key}</span>
                <span className="text-success font-bold">+${bestInst.val.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-subtle">
              <div className="text-xs text-secondary font-medium mb-1">Worst Performing</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{worstInst.key}</span>
                <span className="text-danger font-bold">-${Math.abs(worstInst.val).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategies */}
        <Card className="overflow-hidden border-default shadow-sm">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-3">
            <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <i className="las la-chess-knight text-lg text-primary"></i>
              Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-secondary font-medium mb-1">Best Strategy</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{bestStrat.key}</span>
                <span className="text-success font-bold">+${bestStrat.val.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-subtle">
              <div className="text-xs text-secondary font-medium mb-1">Worst Strategy</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{worstStrat.key}</span>
                <span className="text-danger font-bold">-${Math.abs(worstStrat.val).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="overflow-hidden border-default shadow-sm">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-3">
            <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <i className="las la-clock text-lg text-primary"></i>
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-secondary font-medium mb-1">Most Profitable Session</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{bestSession.key}</span>
                <span className="text-success font-bold">+${bestSession.val.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-subtle">
              <div className="text-xs text-secondary font-medium mb-1">Most Costly Session</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{worstSession.key}</span>
                <span className="text-danger font-bold">-${Math.abs(worstSession.val).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days of Week */}
        <Card className="overflow-hidden border-default shadow-sm">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-3">
            <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <i className="las la-calendar-day text-lg text-primary"></i>
              Days of Week
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-secondary font-medium mb-1">Best Day</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{bestDay.key}</span>
                <span className="text-success font-bold">+${bestDay.val.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-subtle">
              <div className="text-xs text-secondary font-medium mb-1">Worst Day</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{worstDay.key}</span>
                <span className="text-danger font-bold">-${Math.abs(worstDay.val).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Averages */}
        <Card className="overflow-hidden border-default shadow-sm">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-3">
            <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <i className="las la-balance-scale text-lg text-primary"></i>
              Averages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-secondary font-medium mb-1">Average Winner</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-success">+${avgWin.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-subtle">
              <div className="text-xs text-secondary font-medium mb-1">Average Loser</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-danger">-${avgLoss.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specific Setups */}
        <Card className="overflow-hidden border-default shadow-sm">
          <CardHeader className="border-b border-subtle bg-elevated/50 py-3">
            <CardTitle className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
              <i className="las la-crosshairs text-lg text-primary"></i>
              Setups
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-secondary font-medium mb-1">Most Profitable Setup</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary truncate max-w-[150px]">{bestSetup.key}</span>
                <span className="text-success font-bold">+${bestSetup.val.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-subtle">
              <div className="text-xs text-secondary font-medium mb-1">Most Common Losing Setup</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary truncate max-w-[150px]">{worstSetup.key}</span>
                <span className="text-danger font-bold">-${Math.abs(worstSetup.val).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
