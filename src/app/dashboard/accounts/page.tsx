"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { useDemo } from "@/lib/demoContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import { AccountDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import AddAccountModal from "@/components/AddAccountModal";
import EditAccountModal from "@/components/EditAccountModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { DEMO_ACCOUNTS } from "@/lib/adminDemoData";

export default function UserAccountsPage() {
  const { user, tier, role } = useAuth();
  const { isDemoMode } = useDemo();
  const theme = useTierTheme();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountDoc | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    if (user || isDemoMode) {
      fetchAccounts();
    }
  }, [user, role, isDemoMode]);

  const fetchAccounts = async () => {
    try {
      if (isDemoMode) {
        setAccounts(DEMO_ACCOUNTS);
        return;
      }
      if (!user) return;
      if (role === "admin") {
        setAccounts(DEMO_ACCOUNTS);
        return;
      }
      
      const q = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const accs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accs);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const maxAccounts = tier === 'elite' ? Infinity : tier === 'pro' ? 10 : tier === 'starter' ? 3 : 1;
  const hasReachedLimit = accounts.length >= maxAccounts;

  const filteredAccounts = accounts.filter(acc => {
    if (searchQuery && !acc.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === "active") return true; // simplified logic
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

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-32">
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
            className={hasReachedLimit ? "opacity-80" : ""}
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
            <Card key={account.id} className={`group flex flex-col ${theme.card}`}>
              <CardContent className="flex-1 flex flex-col p-6">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center border border-default shrink-0 text-secondary">
                      <i className="las la-shield-alt text-xl"></i>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-primary tracking-tight">
                        {account.label}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="success" size="sm">Active</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setAccountToEdit(account);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 text-muted hover:text-primary hover:bg-elevated rounded-lg transition-colors"
                    title="Edit Account"
                  >
                    <i className="las la-pen text-lg"></i>
                  </button>
                </div>
  
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-2.5">
                    <i className={`las la-trophy text-lg ${theme.icon}`}></i>
                    <span className="text-secondary text-sm font-medium">
                      {account.account_type === 'funded' ? 'Funded Account: ' : 'Phase 1 Challenge: '}
                      <span className="text-primary font-semibold">{account.account_type === 'funded' ? 'Instant Hero' : 'Pay Later Challenge'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <i className={`las la-calendar text-lg ${theme.icon}`}></i>
                    <span className="text-secondary text-sm font-medium">
                      Started: <span className="text-primary font-semibold">{new Date(account.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-subtle mb-6"></div>
  
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mb-6">
                  <div>
                    <p className="text-xs text-secondary font-medium mb-1">Starting Balance</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                      {account.currency === "INR" ? "₹" : "$"}{account.initial_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-medium mb-1">Current Equity</p>
                    <p className={`text-xl sm:text-2xl font-bold tracking-tight ${(account.current_balance || account.initial_balance) >= account.initial_balance ? 'text-success' : 'text-danger'}`}>
                      {account.currency === "INR" ? "₹" : "$"}{(account.current_balance || account.initial_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-xs text-secondary font-medium mb-1">Type</p>
                    <p className="text-sm font-bold text-primary tracking-tight mt-1">
                      {account.account_type === "real" ? "Live" : account.account_type === "funded" ? "Funded" : account.account_type.replace("Goat Funded Challenge ", "")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-subtle">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast(`Broker: ${account.broker}\nCurrency: ${account.currency}\nType: ${account.account_type}`, {
                        icon: 'ℹ️',
                      });
                    }}
                    leftIcon={<i className="las la-key text-lg"></i>}
                  >
                    Credentials
                  </Button>
                  
                  <Link href={`/dashboard/accounts/${account.id}`} className="ml-auto">
                    <Button variant="primary" leftIcon={<i className="las la-eye text-lg"></i>}>
                      Dashboard
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
