"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { AccountDoc, TradeDoc, PropFirmDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";

import { calculateAccountRisk, RiskMetrics } from "@/lib/riskEngine";
import { DEMO_ACCOUNTS, DEMO_TRADES } from "@/lib/adminDemoData";
import { DrawdownGuardian } from "@/components/risk/DrawdownGuardian";
import { DateRangePicker, DateRangePreset, DateRange } from "@/components/ui/DateRangePicker";
import { getLocalJsDate } from "@/lib/dateUtils";

export default function RiskCenterPage() {
  const { user, role } = useAuth();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [trades, setTrades] = useState<Record<string, TradeDoc[]>>({});
  const [propFirms, setPropFirms] = useState<Record<string, PropFirmDoc>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("ALL");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [dateFilter, setDateFilter] = useState<DateRange>({ preset: 'all', start: null, end: null });

  useEffect(() => {
    if (user) {
      fetchRiskData();
    }
  }, [user, role]);

  const fetchRiskData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (role === "admin") {
        setAccounts(DEMO_ACCOUNTS);
        const tMap: Record<string, TradeDoc[]> = {};
        for (const t of DEMO_TRADES) {
          if (!tMap[t.account_id]) tMap[t.account_id] = [];
          tMap[t.account_id].push(t);
        }
        setTrades(tMap);
        setPropFirms({});
        setLoading(false);
        return;
      }

      // Fetch user accounts
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accDocs = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accDocs);

      // Fetch trades for each account and prop firm data
      const tradesMap: Record<string, TradeDoc[]> = {};
      const firmsMap: Record<string, PropFirmDoc> = {};

      for (const acc of accDocs) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tSnap = await getDocs(tQuery);
        const tDocs = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc));
        tDocs.sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime());
        tradesMap[acc.id] = tDocs;

        if (acc.prop_firm && !firmsMap[acc.prop_firm]) {
          const firmRef = doc(db, "prop_firms", acc.prop_firm);
          const firmSnap = await getDoc(firmRef);
          if (firmSnap.exists()) {
            firmsMap[acc.prop_firm] = { id: firmSnap.id, ...firmSnap.data() } as PropFirmDoc;
          }
        }
      }
      
      setTrades(tradesMap);
      setPropFirms(firmsMap);
    } catch (error) {
      console.error("Error fetching risk data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  // Calculate Risk per Account
  const getAccountRisk = (acc: AccountDoc) => {
    let accTrades = trades[acc.id] || [];
    
    // Apply Date Range Filter
    if (dateFilter.start && dateFilter.end) {
      accTrades = accTrades.filter(t => {
        const d = getLocalJsDate(t.close_time);
        return d && d >= dateFilter.start! && d <= dateFilter.end!;
      });
    }

    const metrics = calculateAccountRisk(acc, accTrades);
    
    // Prop Firm Rules targeting
    let applicableRules: any[] = [];
    if (acc.prop_firm && propFirms[acc.prop_firm]) {
      const firm = propFirms[acc.prop_firm];
      applicableRules = firm.rules.filter((rule: any) => {
        if (rule.applicable_plan_ids && rule.applicable_plan_ids.length > 0 && acc.prop_plan_name) {
          return true;
        }
        return true;
      });
    }

    return {
      ...metrics,
      applicableRules
    };
  };

  const displayAccounts = selectedAccountId === "ALL" 
    ? accounts 
    : accounts.filter(a => a.id === selectedAccountId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-shield-alt text-3xl text-indigo-500"></i>
            Risk Center
          </h1>
          <p className="text-secondary text-sm mt-1">Monitor drawdown limits and protect your capital.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangePicker 
            value={dateRangePreset}
            onChange={(range) => {
              setDateRangePreset(range.preset);
              setDateFilter(range);
            }}
          />
          <CustomSelect
            options={[
              { value: "ALL", label: "All Accounts" },
              ...accounts.map(a => ({ value: a.id, label: a.label }))
            ]}
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            icon="las la-wallet"
            className="w-[200px]"
          />
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4 border border-default">
            <i className="las la-shield-alt text-3xl text-muted"></i>
          </div>
          <h3 className="text-lg font-bold text-primary">No Accounts Yet</h3>
          <p className="text-secondary text-sm mt-2 max-w-md">
            Add a trading account to begin monitoring your risk, drawdowns, and prop firm rules.
          </p>
          <Link href="/dashboard/accounts" className="mt-6">
            <button className="px-4 py-2 bg-primary text-inverse font-bold rounded-lg hover:bg-primary-hover transition-colors">
              Add Account
            </button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {displayAccounts.map(acc => {
            const risk = getAccountRisk(acc);
            
            return (
              <Card key={acc.id} className="overflow-hidden border-default shadow-sm">
                <CardHeader className="border-b border-subtle bg-elevated/50 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface border border-default flex items-center justify-center">
                        <i className="las la-shield-alt text-xl text-primary"></i>
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {acc.label}
                          {risk.isOverallBlown || risk.isDailyBlown ? (
                            <Badge variant="danger" size="sm">Violated</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Healthy</Badge>
                          )}
                        </CardTitle>
                        <p className="text-xs text-secondary mt-1 uppercase tracking-wider font-bold">
                          {acc.prop_firm ? `${acc.prop_firm} • ` : ''}{acc.account_type} • {acc.currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-secondary font-medium">Current Balance</div>
                      <div className="text-lg font-bold text-primary">
                        ${risk.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  
                  <div className="mb-6">
                    <DrawdownGuardian 
                      accountBalance={risk.currentBalance}
                      highestEquity={(acc as any).highest_equity || risk.highestWatermark || risk.currentBalance}
                      currentFloatingLoss={(acc as any).current_floating_pnl ?? (risk.currentDailyPnL < 0 ? risk.currentDailyPnL : 0)}
                      dailyLossLimit={acc.daily_loss_limit_pct || 5}
                      isTrailing={(acc as any).is_trailing ?? (acc.drawdown_type === 'trailing')}
                    />
                  </div>

                  {/* Daily & Overall Drawdown Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Daily Drawdown */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Daily Risk</h4>
                        <span className="text-xs font-bold text-secondary">
                          Limit: -${risk.dailyLossLimitValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="w-full h-3 bg-elevated rounded-full overflow-hidden border border-subtle relative mb-2">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all ${risk.isDailyBlown ? 'bg-danger' : risk.dailyDrawdownUsedPct > 80 ? 'bg-warning' : 'bg-primary'}`}
                          style={{ width: `${risk.dailyDrawdownUsedPct}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs font-medium mt-3">
                        <span className={risk.currentDailyPnL < 0 ? 'text-danger' : 'text-success'}>
                          Today: ${risk.currentDailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-secondary">
                          Remaining: ${Math.max(0, risk.dailyDrawdownRemaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Overall Drawdown */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Overall Risk</h4>
                        <span className="text-xs font-bold text-secondary">
                          Limit: ${risk.maxDrawdownThreshold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="w-full h-3 bg-elevated rounded-full overflow-hidden border border-subtle relative mb-2">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all ${risk.isOverallBlown ? 'bg-danger' : risk.overallDrawdownUsedPct > 80 ? 'bg-warning' : 'bg-primary'}`}
                          style={{ width: `${risk.overallDrawdownUsedPct}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs font-medium mt-3">
                        <span className="text-secondary">
                          Drawdown Type: <span className="font-bold text-primary capitalize">{acc.drawdown_type || 'Static'}</span>
                        </span>
                        <span className="text-secondary">
                          Remaining: ${Math.max(0, risk.overallDrawdownRemaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prop Firm Rule Warnings */}
                  {risk.applicableRules.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-subtle">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="las la-gavel text-lg text-secondary"></i>
                        Active Prop Firm Rules
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {risk.applicableRules.slice(0, 6).map(rule => (
                          <div key={rule.id} className="p-3 rounded-lg border border-subtle bg-surface">
                            <div className="font-bold text-sm text-primary mb-1">{rule.title}</div>
                            <p className="text-xs text-secondary line-clamp-2">{rule.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
