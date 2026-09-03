"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AccountDoc, UserDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface AccountWithUser extends AccountDoc {
  userEmail: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState<"ALL" | "GLOBAL" | "DOMESTIC">("ALL");
  
  // Modal state
  const [manageAccountId, setManageAccountId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const fetchAllAccounts = async () => {
    try {
      setLoading(true);
      
      const usersSnap = await getDocs(query(collection(db, "users")));
      const userMap: Record<string, string> = {};
      usersSnap.docs.forEach(d => {
        userMap[d.id] = (d.data() as UserDoc).email;
      });

      const accSnap = await getDocs(query(collection(db, "accounts")));
      const accList: AccountWithUser[] = [];

      accSnap.docs.forEach(d => {
        const data = d.data() as AccountDoc;
        accList.push({
          ...data,
          id: d.id,
          userEmail: userMap[data.owner_uid] || "Unknown User",
        });
      });

      // Sort by newest created
      accList.sort((a, b) => {
        const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
        const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
        return (timeB || 0) - (timeA || 0);
      });

      setAccounts(accList);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
      toast.error("Failed to load global accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!manageAccountId) return;
    
    if (!window.confirm("Are you sure you want to permanently delete this account and all of its trades? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // 1. Delete all trades belonging to this account
      const tradesQuery = query(collection(db, "trades"), where("account_id", "==", manageAccountId));
      const tradesSnap = await getDocs(tradesQuery);
      
      const deletePromises = tradesSnap.docs.map(t => deleteDoc(doc(db, "trades", t.id)));
      await Promise.all(deletePromises);

      // 2. Delete the account itself
      await deleteDoc(doc(db, "accounts", manageAccountId));
      
      toast.success("Account and its trades deleted successfully.");
      setManageAccountId(null);
      fetchAllAccounts();
    } catch (error: any) {
      console.error("Failed to delete account", error);
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('REAL')) {
      return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{type}</span>;
    }
    if (t.includes('FUNDED')) {
      return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{type}</span>;
    }
    // Default to Challenge for evaluation/demo/challenge accounts
    return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{type}</span>;
  };

  const filteredAccounts = accounts.filter(a => {
    if (marketFilter === "ALL") return true;
    const isDomestic = a.market_type === "DOMESTIC" || a.currency === "INR";
    if (marketFilter === "DOMESTIC") return isDomestic;
    return !isDomestic;
  });

  const totalAccounts = filteredAccounts.length;
  const activeFunded = filteredAccounts.filter(a => a.account_type?.toUpperCase().includes('FUNDED')).length;
  const activeChallenge = filteredAccounts.filter(a => !a.account_type?.toUpperCase().includes('FUNDED') && !a.account_type?.toUpperCase().includes('REAL')).length;

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Global Accounts List</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Monitor and manage all trading accounts connected across the platform.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-neutral-700"></div>
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Accounts (All Time)</div>
          <div className="text-3xl font-bold text-white">{totalAccounts}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Active Funded Accounts</div>
          <div className="text-3xl font-bold text-white">{activeFunded}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Active Challenge Accounts</div>
          <div className="text-3xl font-bold text-white">{activeChallenge}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="bg-[#121212] border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Platform Accounts</h2>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value as any)}
            className="input-premium text-xs py-1.5 px-3 max-w-[200px]"
          >
            <option value="ALL">All Markets</option>
            <option value="GLOBAL">Global Only</option>
            <option value="DOMESTIC">Domestic Only</option>
          </select>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#1a1a1a] text-neutral-500 text-[10px] font-bold uppercase tracking-widest border-b border-neutral-800">
                <th className="px-6 py-4">Account Label</th>
                <th className="px-6 py-4">Owner (User)</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Broker</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 font-bold">
                    <LoadingSpinner className="w-8 h-8 mx-auto border-blue-500" />
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 font-bold">
                    No accounts found on the platform.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-[#121212]/50 transition-colors border-b border-neutral-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-bold text-white">{acc.label}</div>
                          <div className="text-xs text-neutral-500 font-mono mt-0.5">ID: {acc.id.substring(0,8)}...</div>
                        </div>
                        {acc.market_type === 'DOMESTIC' || acc.currency === 'INR' ? (
                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Domestic</span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Global</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-300">{acc.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(acc.account_type || "Challenge")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-300 font-medium">{acc.broker || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-400 font-bold">{acc.currency || "USD"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setManageAccountId(acc.id)}
                        className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center ml-auto"
                        title="Manage Account"
                      >
                        <i className="las la-cog text-xl"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Modal Skeleton */}
      {manageAccountId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setManageAccountId(null)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <i className="las la-times text-2xl"></i>
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight mb-4">Manage Account</h2>
            <div className="premium-inner-box p-4 text-center">
              <i className="las la-tools text-4xl text-neutral-500 mb-2"></i>
              <p className="text-sm text-neutral-400">Settings and management options for account:<br/><span className="font-mono text-white font-bold mt-1 inline-block">{manageAccountId}</span></p>
            </div>
            
            <div className="mt-6 border-t border-neutral-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-danger">Danger Zone</h3>
                  <p className="text-xs text-neutral-500 mt-1">Permanently delete this account and all associated trades.</p>
                </div>
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-2.5 bg-danger/10 hover:bg-danger/20 text-danger font-bold rounded-lg transition-colors border border-danger/20 flex justify-center items-center gap-2 text-sm"
              >
                {isDeleting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-trash-alt text-lg"></i>}
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setManageAccountId(null)} className="btn-ghost w-full">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
