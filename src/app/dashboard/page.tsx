"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { provisionMetaApiAccount } from "@/app/actions/mt5Actions";
import toast from "react-hot-toast";
import { AccountDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";

export default function UserDashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Form State
  const [label, setLabel] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [accountType, setAccountType] = useState("Funded");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchAccountTypes();
    }
  }, [user]);

  const fetchAccountTypes = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "platform"));
      if (snap.exists()) {
        const data = snap.data();
        if (data.accountTypes && data.accountTypes.length > 0) {
          setAvailableTypes(data.accountTypes);
          setAccountType(data.accountTypes[0]);
        }
      } else {
        setAvailableTypes(["Funded", "Real"]);
        setAccountType("Funded");
      }
    } catch (e) {
      setAvailableTypes(["Funded", "Real"]);
    }
  };

  const fetchAccounts = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const accs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accs);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreatingAccount(true);

    try {
      const { createManualAccountAction } = await import("@/app/actions/accountActions");
      const res = await createManualAccountAction(user.uid, {
        label,
        broker: server,
        account_type: accountType,
        currency,
        initial_balance: Number(login)
      });

      if (!res.success) {
        toast.error(res.error || "Failed to add account");
        setIsCreatingAccount(false);
        return;
      }

      toast.success("Account added successfully!");
      setIsModalOpen(false);
      setLabel(""); setLogin(""); setPassword(""); setServer("");
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add account");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Calculate overview stats
  const totalAccounts = accounts.length;
  const fundedAccounts = accounts.filter(a => a.account_type === "funded").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Search & Filter Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f1115] border-b border-gray-200 dark:border-transparent p-4 md:px-6 md:py-3 transition-colors duration-300">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search accounts" 
            className="w-full bg-gray-100 dark:bg-[#16181d] border border-gray-200 dark:border-transparent rounded-lg pl-4 pr-10 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 text-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <CustomSelect 
            className="w-32"
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all shrink-0"
          >
            <i className="las la-plus text-[16px]"></i>
            Add
          </button>
        </div>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        {accounts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-yellow-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-[#111318]">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#16181d] rounded-full flex items-center justify-center mb-4">
              <i className="las la-server text-4xl text-gray-400 dark:text-slate-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Accounts Connected</h3>
            <p className="text-gray-500 dark:text-slate-400 text-center max-w-md mb-6">
              Connect your first MT5 account to start tracking your performance.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-2"
            >
              Connect an account now <i className="las la-arrow-right text-[16px]"></i>
            </button>
          </div>
        ) : (
          accounts.map(account => (
            <div 
              key={account.id} 
              className={`group relative bg-white dark:bg-[#111318] rounded-[20px] p-6 flex flex-col justify-between transition-all overflow-hidden border-2 ${account.account_type === "real" ? "border-emerald-900/50 hover:border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.02)] hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]" : "border-blue-900/50 hover:border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.02)] hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]"}`}
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white dark:bg-[#1f2229] flex items-center justify-center shrink-0 border border-yellow-300 dark:border-slate-700">
                      <i className="las la-shield-alt text-[16px] text-gray-700 dark:text-slate-300"></i>
                    </div>
                    <h2 className="text-[17px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {account.label}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-bold tracking-wider ml-1">
                      Active
                    </span>
                  </div>
                </div>
  
                {/* Meta Details */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-2.5">
                    <i className="las la-trophy text-[16px] text-yellow-500"></i>
                    <span className="text-gray-700 dark:text-slate-300 text-sm font-semibold">
                      {account.account_type === 'funded' ? 'Funded Account: ' : 'Phase 1 Challenge: '}
                      <span className="text-gray-500 dark:text-slate-400">{account.account_type === 'funded' ? 'Instant Hero' : 'Pay Later Challenge'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-gray-700 dark:text-slate-300 text-sm font-semibold">
                      Started: <span className="text-gray-500 dark:text-slate-400">{new Date(account.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-white dark:bg-[#1f2229] mb-6"></div>
  
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mb-8">
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mb-1">Starting Balance</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {account.currency === "INR" ? "₹" : "$"}{account.initial_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mb-1">Current Equity</p>
                    <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${(account.current_balance || account.initial_balance) >= account.initial_balance ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {account.currency === "INR" ? "₹" : "$"}{(account.current_balance || account.initial_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mb-1">Type</p>
                    <p className="text-[15px] font-extrabold text-gray-900 dark:text-white tracking-tight mt-1 sm:mt-0">
                      {account.account_type === "real" ? "Live" : account.account_type === "funded" ? "Funded" : account.account_type.replace("Goat Funded Challenge ", "")}
                    </p>
                  </div>
                </div>
              </div>
  
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    toast(`Broker: ${account.broker}\nCurrency: ${account.currency}\nType: ${account.account_type}`, {
                      icon: 'ℹ️',
                    });
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#252830] hover:bg-gray-200 dark:hover:bg-[#2c3038] text-gray-900 dark:text-white text-[13px] font-bold rounded-[10px] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Credentials
                </button>
                
                <Link 
                  href={`/dashboard/accounts/${account.id}`}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black text-[13px] font-extrabold rounded-[10px] transition-all"
                >
                  <i className="las la-eye text-[16px]"></i>
                  View Dashboard
                </Link>
              </div>
              
            </div>
          ))
        )}
      </div>

      {/* Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#fafafa] dark:bg-[#0a0f1c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-yellow-300 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-yellow-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0f1523]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                <i className="las la-server text-2xl text-blue-500"></i> Connect MT5 Account
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white transition">
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Account Label</label>
                <input type="text" placeholder="e.g. Main Funded $50k" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Broker / Prop Firm</label>
                <input type="text" placeholder="e.g. Exness, FTMO, GoatFunded" value={server} onChange={(e) => setServer(e.target.value)} className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Starting Balance</label>
                  <input type="number" step="any" placeholder="5000" value={login} onChange={(e) => setLogin(e.target.value)} className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Currency</label>
                  <CustomSelect 
                    options={[
                      { value: "USD", label: "USD" },
                      { value: "INR", label: "INR" }
                    ]}
                    value={currency} 
                    onChange={(val) => setCurrency(val as "USD" | "INR")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</label>
                  <CustomSelect 
                    options={availableTypes.map(type => ({ value: type, label: type }))}
                    value={accountType} 
                    onChange={setAccountType}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white transition-colors rounded-lg hover:bg-[#e5e7eb] dark:bg-slate-800">Cancel</button>
                <button type="submit" disabled={isCreatingAccount} className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 text-black px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  {isCreatingAccount ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
