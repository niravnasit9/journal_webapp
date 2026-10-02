"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { useDemo } from "@/lib/demoContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import { tradeService } from "@/services/tradeService";
import Link from "next/link";
import AddAccountModal from "@/components/AddAccountModal";
import EditAccountModal from "@/components/EditAccountModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { DEMO_ACCOUNTS } from "@/lib/adminDemoData";
import { useUiStore } from "@/store/useUiStore";


export default function UserAccountsPage() {
  const { user, tier, role } = useAuth();
  const { isDemoMode } = useDemo();
  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const theme = useTierTheme();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountDoc | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allTrades, setAllTrades] = useState<TradeDoc[]>([]);
  
  useEffect(() => {
    if (user || isDemoMode) {
      fetchAccounts();
    }
  }, [user, role, isDemoMode]);

  const fetchAccounts = async () => {
    try {
      if (role === "admin") {
        setAccounts(DEMO_ACCOUNTS);
        return;
      }
      if (!user) return;

      const q = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const accs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accs);

      // Fetch trades to compute breakdowns
      const accountIds = accs.map(a => a.id);
      const fetchedTrades = await tradeService.fetchTradesForAccounts(accountIds);
      setAllTrades(fetchedTrades);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const maxAccounts = tier === 'elite' ? Infinity : tier === 'pro' ? 10 : tier === 'starter' ? 3 : 1;
  const hasReachedLimit = accounts.length >= maxAccounts;

  const filteredAccounts = accounts.filter(acc => {
    // 1. Workspace filter
    const isDom = acc.market_type === "DOMESTIC";
    if (isDomestic && !isDom) return false;
    if (!isDomestic && isDom) return false;
    
    // 2. Search filter
    if (searchQuery && !acc.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (statusFilter === "active") return true; 
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in font-sans">
      
      {/* Search & Filter Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-default rounded-xl p-4 transition-colors">
        <div className="w-full md:w-96">
          <Input 
            placeholder="Search accounts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<i className="las la-search text-lg"></i>}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full md:w-auto">
          
          <div className="w-full sm:w-32 flex-shrink-0">
            <Select 
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <Button 
            onClick={() => {
              if (hasReachedLimit) {
                toast.error(`You've reached your limit of ${maxAccounts} account${maxAccounts > 1 ? 's' : ''} on the ${tier || 'Free'} plan. Upgrade to add more!`, {
                  icon: '🔒',
                  duration: 4000
                });
              } else {
                setIsModalOpen(true);
              }
            }}
            variant="primary"
            className={`w-full sm:w-auto justify-center ${hasReachedLimit ? "opacity-80" : ""}`}
            leftIcon={<i className={`las ${hasReachedLimit ? 'la-lock' : 'la-plus'} text-lg`}></i>}
          >
            {hasReachedLimit ? 'Upgrade to Add' : 'Add'}
          </Button>
        </div>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-strong rounded-xl bg-surface">
            <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mb-4 text-muted">
              <i className="las la-server text-4xl"></i>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">No Accounts Found</h3>
            <p className="text-secondary text-center max-w-md mb-6">
              Connect your first MT5 account to start tracking your performance.
            </p>
            <Button 
              variant="ghost" 
              onClick={() => setIsModalOpen(true)}
              rightIcon={<i className="las la-arrow-right text-lg"></i>}
            >
              Connect an account now
            </Button>
          </div>
        ) : (
          filteredAccounts.map(account => (
            <Card key={account.id} className={`group flex flex-col border border-white/5 bg-gradient-to-br from-surface to-elevated hover:border-primary/20 transition-all duration-300 shadow-xl overflow-hidden relative ${theme.card}`}>
              {/* Subtle background flair */}
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <CardContent className="flex-1 flex flex-col p-6 sm:p-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center border border-white/5 shrink-0 text-primary shadow-inner">
                      <i className="las la-shield-alt text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                        {account.label}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded backdrop-blur-sm border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                        </span>
                        <span className="text-xs text-secondary font-medium flex items-center gap-1">
                          <i className="las la-calendar text-sm"></i> {new Date(account.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-secondary font-medium flex items-center gap-1">
                          <i className="las la-building text-sm"></i> {isDomestic ? (account.broker || "Personal") : (account.account_type === "real" ? "Live" : account.account_type === "funded" ? "Funded" : "Challenge")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setAccountToEdit(account);
                      setIsEditModalOpen(true);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary hover:bg-white/5 rounded-full transition-colors"
                    title="Edit Account"
                  >
                    <i className="las la-ellipsis-v text-xl"></i>
                  </button>
                </div>
  
                {/* Financials */}
                {(() => {
                  const accTrades = allTrades.filter(t => t.account_id === account.id);
                  let ipoPnl = 0;
                  let tradePnl = 0;
                  let computedEquity = account.initial_balance;
                  
                  accTrades.forEach(t => {
                    const pnl = isDomestic ? ((t as any).net_pnl ?? ((t as any).domestic_segment === 'IPO' ? t.profit_loss : 0)) : (t.profit_loss || 0);
                    computedEquity += pnl;
                    if ((t as any).domestic_segment === 'IPO') {
                      ipoPnl += pnl;
                    } else {
                      tradePnl += pnl;
                    }
                  });
                  const totalPnl = computedEquity - account.initial_balance;
                  
                  return (
                    <div className="flex-1 flex flex-col justify-end">
                      {/* Main Balances */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-70">Starting Balance</p>
                          <p className="text-xl font-medium text-secondary tracking-tight">
                            {account.currency === "INR" ? "₹" : "$"}{account.initial_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 opacity-70">Current Equity</p>
                          <p className={`text-4xl font-black tracking-tighter ${computedEquity >= account.initial_balance ? 'text-primary' : 'text-danger'}`}>
                            {account.currency === "INR" ? "₹" : "$"}{computedEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* P&L Breakdown (Clean Minimal Bar) */}
                      <div className="mb-6 p-4 rounded-xl bg-black/20 border border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 backdrop-blur-sm">
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-70">Total Net Return</p>
                          <p className={`text-lg font-bold tracking-tight ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {totalPnl >= 0 ? '+' : '-'}{account.currency === "INR" ? "₹" : "$"}{Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-70">Trades</p>
                          <p className={`text-sm font-semibold ${tradePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tradePnl >= 0 ? '+' : '-'}{account.currency === "INR" ? "₹" : "$"}{Math.abs(tradePnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-70">IPOs</p>
                          <p className={`text-sm font-semibold ${ipoPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {ipoPnl >= 0 ? '+' : '-'}{account.currency === "INR" ? "₹" : "$"}{Math.abs(ipoPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 mt-auto">
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-surface/90 backdrop-blur-md border border-subtle shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}>
                           <div className="flex-1 p-4 relative">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
                              <div className="flex items-start relative z-10">
                                <div className="flex-shrink-0 pt-0.5">
                                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-inner">
                                    <i className="las la-key text-xl"></i>
                                  </div>
                                </div>
                                <div className="ml-4 flex-1">
                                  <p className="text-sm font-bold text-primary tracking-tight">Account Credentials</p>
                                  <div className="mt-2 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center bg-black/20 px-2 py-1.5 rounded-md border border-white/5">
                                      <span className="text-secondary font-bold uppercase tracking-widest text-[9px]">Broker</span>
                                      <span className="text-primary font-semibold">{account.broker || 'Personal'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/20 px-2 py-1.5 rounded-md border border-white/5">
                                      <span className="text-secondary font-bold uppercase tracking-widest text-[9px]">Currency</span>
                                      <span className="text-primary font-semibold">{account.currency}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/20 px-2 py-1.5 rounded-md border border-white/5">
                                      <span className="text-secondary font-bold uppercase tracking-widest text-[9px]">Type</span>
                                      <span className="text-primary font-semibold">{account.account_type}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                           </div>
                        </div>
                      ), { duration: 4000 });
                    }}
                    className="w-full sm:w-auto text-secondary hover:text-primary hover:bg-white/5 px-4 h-11 rounded-xl font-semibold justify-center"
                    leftIcon={<i className="las la-key text-lg"></i>}
                  >
                    Credentials
                  </Button>
                  
                  <Link href={`/dashboard/accounts/${account.id}`} className="w-full sm:w-auto sm:ml-auto block">
                    <Button variant="primary" className="w-full h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 justify-center" rightIcon={<i className="las la-arrow-right text-lg"></i>}>
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="las la-server text-xl text-blue-500"></i> Connect MT5 Account
              </CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-primary transition-colors">
                <i className="las la-times text-xl"></i>
              </button>
            </CardHeader>
            <CardContent className="text-center pt-8">
              <i className="las la-tools text-5xl text-warning mb-4"></i>
              <h4 className="text-lg font-bold text-primary mb-2">Automated Connection</h4>
              <p className="text-secondary text-sm mb-8">
                Our MT5 server connection is currently in beta. For now, please use the manual connection method to sync your trading data.
              </p>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsAddManualOpen(true);
                }}
              >
                Connect Manually Instead
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <AddAccountModal
        isOpen={isAddManualOpen}
        onClose={() => setIsAddManualOpen(false)}
        onAdded={fetchAccounts}
      />

      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        account={accountToEdit}
        onUpdated={fetchAccounts}
      />
    </div>
  );
}
