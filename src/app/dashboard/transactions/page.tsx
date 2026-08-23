"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useTierTheme } from "@/hooks/useTierTheme";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";

interface Transaction {
  id: string;
  txid: string;
  tier: string;
  amount: number;
  status: "success" | "pending" | "failed";
  created_at: string;
}
import { DEMO_TRANSACTIONS } from "@/lib/adminDemoData";
export default function TransactionsPage() {
  const { user, role } = useAuth();
  const theme = useTierTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & UI State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, role]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (role === "admin") {
        setTransactions(DEMO_TRANSACTIONS as any);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "transactions"), 
        where("uid", "==", user!.uid),
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactions(docs);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <i className="las la-check-circle"></i> Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
            <i className="las la-times-circle"></i> Failed
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <i className="las la-clock"></i> Pending
          </span>
        );
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchStatus = statusFilter === "all" || tx.status.toLowerCase() === statusFilter;
    const matchTier = tierFilter === "all" || tx.tier.toLowerCase() === tierFilter;
    return matchStatus && matchTier;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 pt-8">
      
      {/* Temporary Test Mode Banner */}
      <div className="bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl flex items-center gap-3 font-semibold text-sm shadow-sm">
        <i className="las la-flask text-xl"></i> TEST MODE: Dummy Data Active
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-receipt text-3xl text-info"></i>
            Transaction History
          </h1>
          <p className="text-secondary text-sm mt-1">Review your past payments and subscription charges.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:w-36 bg-surface border border-default rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-info text-primary appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select 
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="flex-1 md:w-36 bg-surface border border-default rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-info text-primary appearance-none cursor-pointer capitalize"
          >
            <option value="all">All Plans</option>
            <option value="elite">Elite</option>
            <option value="pro">Pro</option>
            <option value="starter">Starter</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden border-subtle">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <i className="las la-file-invoice-dollar text-3xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">No Transactions Found</h3>
            <p className="text-secondary text-sm max-w-md">
              You haven't made any payments yet. When you upgrade your plan, your billing history will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-base border-b border-subtle">
                    <th className="py-4 px-6 font-bold text-xs text-secondary uppercase tracking-widest">Date</th>
                    <th className="py-4 px-6 font-bold text-xs text-secondary uppercase tracking-widest">Transaction ID</th>
                    <th className="py-4 px-6 font-bold text-xs text-secondary uppercase tracking-widest">Plan</th>
                    <th className="py-4 px-6 font-bold text-xs text-secondary uppercase tracking-widest text-right">Amount</th>
                    <th className="py-4 px-6 font-bold text-xs text-secondary uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="">
                  {filteredTransactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors last:border-0 cursor-pointer"
                    >
                      <td className="py-4 px-6 text-sm text-secondary">
                        {new Date(tx.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono text-slate-500 truncate max-w-[200px]">
                        {tx.txid}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-primary capitalize">
                        {tx.tier}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-primary text-right">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {getStatusBadge(tx.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (Hidden on desktop) */}
            <div className="block md:hidden space-y-4 px-2 mb-4">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-surface active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-secondary">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-primary capitalize text-base">{tx.tier} Plan</h4>
                    <span className="font-bold text-primary text-lg">${tx.amount.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Transaction ID</span>
                      <span className="font-mono text-xs text-slate-500 truncate">{tx.txid}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in flex items-center justify-center p-4"
            onClick={() => setSelectedTx(null)}
          >
          {/* Modal Panel */}
          <div 
            className="w-full max-w-xl bg-surface shadow-2xl z-50 flex flex-col animate-in zoom-in-95 duration-200 border border-subtle rounded-2xl overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-subtle flex justify-between items-center bg-surface/80 backdrop-blur-md">
              <h2 className="text-xl font-bold text-primary tracking-tight">Transaction Receipt</h2>
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-elevated text-muted hover:text-primary transition-colors"
              >
                <i className="las la-times text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <i className="las la-wallet text-info text-lg"></i> Payment Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan</p>
                    <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-bold rounded-md capitalize">
                      {selectedTx.tier} Tier
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    {getStatusBadge(selectedTx.status)}
                  </div>
                </div>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 my-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">${selectedTx.amount.toFixed(2)}</p>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                    <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                      {new Date(selectedTx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <i className="las la-link text-info text-lg"></i> Reference Details
                </h3>
                <div className="space-y-4">
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transaction ID</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{selectedTx.txid}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTx.txid);
                          // toast.success("Copied!"); 
                        }} 
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors shrink-0"
                      >
                        <i className="las la-copy text-lg"></i>
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 my-4"></div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Internal Reference</p>
                    <p className="font-mono text-xs font-medium text-slate-500 truncate">{selectedTx.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-3 items-start px-2">
                <i className="las la-shield-alt text-slate-400 text-xl mt-0.5"></i>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your payment was processed securely. If you have any questions about this receipt, please contact support with your Transaction ID.
                </p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-subtle bg-surface/80 backdrop-blur-md">
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Close Receipt
              </button>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
