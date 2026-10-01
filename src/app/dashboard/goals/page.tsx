"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { GoalDoc, TradeDoc, AccountDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { DEMO_GOALS } from "@/lib/adminDemoData";
import { useDemo } from "@/lib/demoContext";
import { useUiStore } from "@/store/useUiStore";
import { useAccountData } from "@/hooks/useAccountData";
import { useTradeData } from "@/hooks/useTradeData";
import GoalModal from "@/components/dashboard/GoalModal";
import GoalDetailsModal from "@/components/dashboard/GoalDetailsModal";
import { useMemo } from "react";

export default function GoalsPage() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const { activeWorkspace } = useUiStore();
  const [goals, setGoals] = useState<GoalDoc[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDoc | null>(null);
  const [detailsGoal, setDetailsGoal] = useState<GoalDoc | null>(null);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: activeWorkspace === 'DOMESTIC' ? 'INR' : 'USD', 
      minimumFractionDigits: 0 
    }).format(val);
  };

  const isDomestic = activeWorkspace === "DOMESTIC";
  const { accounts, loading: accLoading } = useAccountData(user?.uid, isDemoMode, role);
  
  const activeAccounts = useMemo(() => {
    return accounts.filter((a: AccountDoc) =>
      (isDomestic && a.market_type === "DOMESTIC") ||
      (!isDomestic && a.market_type !== "DOMESTIC")
    );
  }, [accounts, isDomestic]);

  const accountIds = useMemo(() => activeAccounts.map((a: AccountDoc) => a.id), [activeAccounts]);
  const { trades, loading: tradeLoading } = useTradeData(accountIds);

  const loading = accLoading || tradeLoading || goalsLoading;

  useEffect(() => {
    if (user) fetchGoals();
  }, [user, role, isDemoMode]);

  const fetchGoals = async () => {
    if (!user) return;
    try {
      setGoalsLoading(true);
      
      if (role === "admin") {
        setGoals(DEMO_GOALS);
        setGoalsLoading(false);
        return;
      }

      // Fetch accounts to get workspace specific trades
      // Fetch goals
      const gq = query(collection(db, "goals"), where("owner_uid", "==", user.uid));
      const gsnap = await getDocs(gq);
      const fetchedGoals = gsnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoalDoc));
      fetchedGoals.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
      setGoals(fetchedGoals);

    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteDoc(doc(db, "goals", goalId));
      toast.success("Goal deleted");
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const computeGoalProgress = (goal: GoalDoc) => {
    if (role === "admin") return goal.current_value; // Use static value for demo

    // Use all trades instead of filtering by goal creation date
    const relevantTrades = trades;

    let currentValue = 0;

    if (goal.type === 'profit_target') {
      const netGain = relevantTrades.reduce((sum, t) => sum + (activeWorkspace === 'DOMESTIC' ? ((t as any).net_pnl || ((t as any).domestic_segment === 'IPO' ? t.profit_loss : 0) || 0) : t.profit_loss || 0), 0);
      const totalInitialBalance = activeAccounts.reduce((sum, a) => sum + (a.initial_balance || 0), 0);
      currentValue = totalInitialBalance + netGain;
    } else if (goal.type === 'win_rate') {
      const wins = relevantTrades.filter(t => (activeWorkspace === 'DOMESTIC' ? ((t as any).net_pnl || ((t as any).domestic_segment === 'IPO' ? t.profit_loss : 0) || 0) : t.profit_loss || 0) > 0).length;
      currentValue = relevantTrades.length > 0 ? (wins / relevantTrades.length) * 100 : 0;
    } else if (goal.type === 'trades_count') {
      currentValue = relevantTrades.length;
    } else {
      currentValue = goal.current_value || 0;
    }

    return currentValue;
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-default">
              <i className="las la-bullseye text-2xl text-blue-500"></i>
            </div>
            Trading Goals
          </h1>
          <p className="text-secondary text-sm mt-1">Set targets, track progress, and build discipline.</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<i className="las la-plus text-lg"></i>}
          onClick={() => {
            setEditingGoal(null);
            setShowModal(true);
          }}
        >
          Create Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4 border border-default">
            <i className="las la-flag text-3xl text-muted"></i>
          </div>
          <h3 className="text-lg font-bold text-primary">No Active Goals</h3>
          <p className="text-secondary text-sm mt-2 max-w-md">
            You haven't set any trading goals yet. Setting clear targets can help maintain focus and discipline.
          </p>
          <Button 
            variant="primary" 
            className="mt-6"
            onClick={() => {
              setEditingGoal(null);
              setShowModal(true);
            }}
          >
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const currentValue = computeGoalProgress(goal);
            const progress = goal.target_value > 0 ? (currentValue / goal.target_value) * 100 : 0;
            const cappedProgress = Math.max(0, Math.min(100, progress));
            const isCompleted = currentValue >= goal.target_value;
            
            return (
              <Card 
                key={goal.id} 
                onClick={() => setDetailsGoal(goal)}
                className="overflow-hidden border-default shadow-sm group hover:border-blue-500/30 transition-colors cursor-pointer"
              >
                <CardHeader className="border-b border-subtle bg-elevated/50 py-4 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-primary mb-1">
                      {goal.title}
                    </CardTitle>
                    <Badge 
                      variant={isCompleted ? 'success' : goal.status === 'failed' ? 'danger' : 'info'} 
                      size="sm"
                    >
                      {isCompleted ? 'Completed' : goal.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGoal(goal);
                        setShowModal(true);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/10 text-secondary hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <i className="las la-pen text-lg"></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(goal.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10 text-secondary hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <i className="las la-trash-alt text-lg"></i>
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-xs text-secondary font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <i className="las la-chart-bar"></i> Progress
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {goal.type === 'profit_target' ? formatMoney(currentValue) : Number(currentValue.toFixed(2)).toLocaleString()} 
                        <span className="text-sm text-secondary font-medium ml-1">/ {goal.type === 'profit_target' ? formatMoney(goal.target_value) : goal.target_value.toLocaleString()}{goal.type === 'win_rate' ? '%' : ''}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
                      {cappedProgress.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-elevated rounded-full overflow-hidden border border-subtle relative mt-3">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${cappedProgress}%` }}
                    />
                  </div>

                  {goal.deadline && (
                    <div className="mt-4 pt-4 border-t border-subtle flex items-center gap-2 text-xs text-secondary font-medium">
                      <i className="las la-clock text-lg"></i>
                      Deadline: {goal.deadline?.toMillis ? new Date(goal.deadline.toMillis()).toLocaleDateString() : new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <GoalModal 
          editingGoal={editingGoal}
          onClose={() => {
            setShowModal(false);
            setEditingGoal(null);
          }} 
          onSuccess={() => {
            setShowModal(false);
            setEditingGoal(null);
            fetchGoals();
          }} 
        />
      )}

      {detailsGoal && (
        <GoalDetailsModal
          goal={detailsGoal}
          currentValue={computeGoalProgress(detailsGoal)}
          formatMoney={formatMoney}
          onClose={() => setDetailsGoal(null)}
          tradesCount={trades.length}
          winRate={trades.length > 0 ? (trades.filter(t => (activeWorkspace === 'DOMESTIC' ? ((t as any).net_pnl || ((t as any).domestic_segment === 'IPO' ? t.profit_loss : 0) || 0) : t.profit_loss || 0) > 0).length / trades.length) * 100 : 0}
        />
      )}
    </div>
  );
}
