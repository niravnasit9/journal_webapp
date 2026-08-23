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

export default function TransactionsPage() {
  const { user } = useAuth();
  const theme = useTierTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Try to fetch from firestore if a transactions collection exists
      const q = query(
        collection(db, "transactions"), 
        where("uid", "==", user!.uid),
        // orderBy("created_at", "desc") // Requires index
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      
      // Sort in memory to avoid needing a composite index immediately
      docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactions(docs);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      // We don't toast here to avoid annoying users if the collection just isn't seeded yet
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-receipt text-3xl text-info"></i>
            Transaction History
          </h1>
          <p className="text-secondary text-sm mt-1">Review your past payments and subscription charges.</p>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden border-subtle">
        {transactions.length === 0 ? (
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
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors last:border-0">
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
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-surface">
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
    </div>
  );
}
