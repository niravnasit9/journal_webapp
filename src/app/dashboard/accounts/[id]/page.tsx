"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/authContext";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import PnLChart from "@/components/PnLChart";
import TradeJournal from "@/components/TradeJournal";
import AddTradeModal from "@/components/AddTradeModal";
import EditTradeModal from "@/components/EditTradeModal";
import toast from "react-hot-toast";
import { useTierTheme } from "@/hooks/useTierTheme";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChallengeTracker } from "@/components/risk/ChallengeTracker";
import { StatsGrid } from "@/components/analytics/StatsGrid";
import { PsychologyMatrix } from "@/components/insights/PsychologyMatrix";
import { TiltAnalyzer } from "@/components/insights/TiltAnalyzer";
import { RecoverySimulator } from "@/components/risk/RecoverySimulator";
import { EdgeDecayChart } from "@/components/analytics/EdgeDecayChart";
import { BehavioralChain } from "@/components/insights/BehavioralChain";
import { CoachingAlerts } from "@/components/insights/CoachingAlerts";
import { generateCoachingAlerts } from "@/lib/coachingEngine";
import { PropFirmOverview } from "@/components/risk/PropFirmOverview";
import { PsychologyDashboard } from "@/components/insights/PsychologyDashboard";
type TabType = "Account Overview" | "Trading Overview" | "Trading History" | "Psychology" | "Calendar";

export default function AccountDetailView() {
  const { id } = useParams();
  const accountId = id as string;
  const { user, tier } = useAuth();
  const theme = useTierTheme();
  const router = useRouter();

  const [account, setAccount] = useState<AccountDoc | null>(null);
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState<TabType>("Account Overview");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<TradeDoc | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const accRef = doc(db, "accounts", accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        const data = accSnap.data() as AccountDoc;
        if (data.owner_uid !== user?.uid) {
          console.error("Unauthorized access to account!");
          router.push("/dashboard");
          return;
        }
        setAccount({ ...data, id: accSnap.id });
      } else {
        console.error("No such account!");
        router.push("/dashboard");
        return;
      }

      const q = query(collection(db, "trades"), where("account_id", "==", accountId));
      const querySnapshot = await getDocs(q);
      const fetchedTrades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
      
      fetchedTrades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
      setTrades(fetchedTrades);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const handleDeleteTrade = (tradeId: string) => {
    setTradeToDelete(tradeId);
  };

  const confirmDeleteTrade = async () => {
    if (!tradeToDelete) return;
    setIsDeleting(true);
    
    try {
      const { deleteManualTradeAction } = await import("@/app/actions/tradeActions");
      const res = await deleteManualTradeAction(tradeToDelete, accountId);
      
      if (res.success) {
        toast.success("Trade deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete trade: " + res.error);
      }
    } catch (error: any) {
      toast.error("Error deleting trade: " + error.message);
    } finally {
      setIsDeleting(false);
      setTradeToDelete(null);
    }
  };

  const handleEditTrade = (trade: TradeDoc) => {
    setTradeToEdit(trade);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }
  if (!account) {
    return <div className="text-danger p-8 font-bold">Account not found</div>;
  }

  const initialBalance = account.initial_balance || 0;
  const totalTrades = trades.length;
  const overallPnL = trades.reduce((acc, trade) => acc + (trade.profit_loss - (trade.commission || 0)), 0);
  const currentBalance = initialBalance + overallPnL;
  
  let runningBalance = initialBalance;
  const chronologicalTrades = [...trades].sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
  const equityData = chronologicalTrades.map(trade => {
    runningBalance += (trade.profit_loss - (trade.commission || 0));
    return {
      date: new Date(trade.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      balance: runningBalance,
      equity: runningBalance,
    };
  });
  
  if (equityData.length > 0) {
    equityData.unshift({
      date: 'Start',
      balance: initialBalance,
      equity: initialBalance
    });
  }

  // Drawdown Logic Engine
  let highestWatermark = initialBalance;
  let maxDrawdownValue = 0; 

  chronologicalTrades.forEach(t => {
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
    maxDrawdownThreshold = highestWatermark * (1 - (maxDrawdownPct / 100));
  } else {
    maxDrawdownThreshold = initialBalance * (1 - (maxDrawdownPct / 100));
  }
  
  const dailyPnL: Record<string, number> = {};
  trades.forEach(t => {
    const dateStr = new Date(t.close_time).toISOString().split('T')[0];
    dailyPnL[dateStr] = (dailyPnL[dateStr] || 0) + (t.profit_loss - (t.commission || 0));
  });

  const previousDays = Object.keys(dailyPnL);
  const currentDay = chronologicalTrades.length > 0 ? new Date(chronologicalTrades[chronologicalTrades.length - 1].close_time).toISOString().split('T')[0] : '';
  const dailyDrawdownType = account.daily_drawdown_type || 'balance';
  
  const currentDailyPnL = dailyPnL[currentDay] || 0;
  const dailyLossLimitValue = (initialBalance * dailyLossLimitPct) / 100;

  const winningTrades = trades.filter(t => (t.profit_loss - (t.commission || 0)) > 0);
  const losingTrades = trades.filter(t => (t.profit_loss - (t.commission || 0)) <= 0);
  
  const avgWinningTrade = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0) / winningTrades.length : 0;
  const avgLosingTrade = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0) / losingTrades.length : 0;
  const avgTradePnL = totalTrades > 0 ? overallPnL / totalTrades : 0;

  const avgRR = totalTrades === 0 ? 0 : (avgLosingTrade !== 0 ? Math.abs(avgWinningTrade / avgLosingTrade) : (avgWinningTrade > 0 ? avgWinningTrade : 0));
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss - (t.commission || 0)), 0));
  const profitFactor = totalTrades === 0 ? 0 : (grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0));

  const totalCommissions = trades.reduce((sum, t) => sum + (t.commission || 0), 0);
  const totalVolume = trades.reduce((sum, t) => sum + (t.lot_size || 0), 0);
  const tradingDaysCount = Object.keys(dailyPnL).length;
  const avgDailyPnL = tradingDaysCount > 0 ? overallPnL / tradingDaysCount : 0;
  
  const winningDays = Object.values(dailyPnL).filter(pnl => pnl > 0);
  const losingDays = Object.values(dailyPnL).filter(pnl => pnl <= 0);
  
  const avgWinningDay = winningDays.length > 0 ? winningDays.reduce((a,b) => a+b, 0) / winningDays.length : 0;
  const avgLosingDay = losingDays.length > 0 ? losingDays.reduce((a,b) => a+b, 0) / losingDays.length : 0;

  const alerts = generateCoachingAlerts(trades);

  const TABS: TabType[] = ["Account Overview", "Trading Overview", "Trading History", "Psychology"];

  const StatRow = ({ label, value, isCurrency = false, colorClass = "text-primary" }: { label: string, value: string | number, isCurrency?: boolean, colorClass?: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-subtle last:border-0">
      <span className="text-secondary text-sm">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>
        {isCurrency && typeof value === 'number' && value < 0 ? '-' : ''}
        {isCurrency ? (account.currency === "INR" ? "₹" : "$") : ''}
        {isCurrency ? Math.abs(Number(value)).toFixed(2) : value}
      </span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in font-sans">
      
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center shrink-0 border border-default">
              <span className="text-secondary font-bold text-xl">{account.label[0]}</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
                {account.label}
              </h1>
              <div className="mt-1">
                <Badge variant={account.account_type === 'real' ? 'success' : 'info'} size="sm">
                  {account.account_type}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<i className="las la-plus text-lg"></i>}
              className="w-full md:w-auto"
            >
              Add Trade
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-b border-subtle pb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab 
                ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                : 'bg-elevated text-secondary hover:text-primary hover:bg-surface border border-default'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Account Overview" && (
        <div className="space-y-6">
          <PropFirmOverview account={account} trades={trades} currency={account.currency as "USD" | "INR"} />
          <RecoverySimulator account={account} trades={trades} currency={account.currency as "USD" | "INR"} />
          <ChallengeTracker account={account} currency={account.currency as "USD" | "INR"} />
        </div>
      )}

      {activeTab === "Trading Overview" && (
        <div className="space-y-6">
          <CoachingAlerts alerts={alerts} />
          <StatsGrid trades={trades} currency={account.currency as "USD" | "INR"} />
          <EdgeDecayChart trades={trades} />


          <Card className="p-6 relative overflow-hidden">
            {!(tier === 'pro' || tier === 'elite') && (
              <div className="absolute inset-0 bg-surface/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center border border-default mb-4">
                  <i className="las la-lock text-3xl text-primary"></i>
                </div>
                <h3 className="text-xl font-black text-primary mb-2">Advanced Charts Locked</h3>
                <p className="text-sm text-secondary font-medium mb-6 max-w-sm">
                  Upgrade to Pro or Elite to visualize your equity curve.
                </p>
                <Link href="/pricing">
                  <Button variant="primary">Upgrade Now</Button>
                </Link>
              </div>
            )}
            <div className={!(tier === 'pro' || tier === 'elite') ? 'opacity-30 pointer-events-none' : ''}>
              <h2 className="text-lg font-bold text-primary mb-6">Daily Net Cumulative P&L</h2>
              <PnLChart data={equityData} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Trading History" && (
        <TradeJournal trades={trades} onDeleteTrade={handleDeleteTrade} onEditTrade={handleEditTrade} />
      )}

      {activeTab === "Psychology" && (
        <div className="space-y-6">
          <PsychologyDashboard trades={trades} currency={account.currency as "USD" | "INR"} />
          <PsychologyMatrix trades={trades} currency={account.currency as "USD" | "INR"} />
          <TiltAnalyzer trades={trades} />
          <BehavioralChain trades={trades} currency={account.currency as "USD" | "INR"} />
        </div>
      )}

      <AddTradeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        accountId={accountId} 
        accountCurrency={account.currency as "USD" | "INR"}
        onAdded={fetchData} 
      />

      <EditTradeModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setTradeToEdit(null); }} 
        accountId={accountId}
        trade={tradeToEdit}
        accountCurrency={account.currency as "USD" | "INR"}
        onUpdated={fetchData} 
      />
    </div>
  );
}
