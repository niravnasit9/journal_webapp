"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs } from "firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-hot-toast";

interface Transaction {
  id: string; // The txid
  uid: string;
  tier: string;
  cryptoId: string;
  amountUsd: number;
  amountCrypto: number;
  network: string;
  tokenSymbol: string;
  timestamp: string;
  processedAt: string;
  fromAddress: string;
  toAddress: string;
  transactionFee: string;
  gasPrice?: string;
  status: string;
  isTestTransaction: boolean;
}

export default function TransactionsAdminPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, "processed_txids"));
      const snapshot = await getDocs(q);
      
      const txs: Transaction[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || data.used_by || "Unknown",
          tier: data.tier || "N/A",
          cryptoId: data.cryptoId || "Unknown",
          amountUsd: data.amount || data.expectedUsd || 0,
          amountCrypto: data.amountCrypto || data.amount || 0,
          network: data.network || "Unknown",
          tokenSymbol: data.tokenSymbol || "N/A",
          timestamp: data.timestamp || new Date().toISOString(),
          processedAt: data.processedAt || data.timestamp || new Date().toISOString(),
          fromAddress: data.fromAddress || "N/A",
          toAddress: data.toAddress || "N/A",
          transactionFee: data.transactionFee || "N/A",
          gasPrice: data.gasPrice || "N/A",
          status: data.status || "SUCCESS",
          isTestTransaction: data.isTestTransaction || false,
        };
      });

      // Sort in memory for simplicity (newest first based on processedAt)
      txs.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
      
      setTransactions(txs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTx = transactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.tier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const truncate = (str: string, length = 12) => {
    if (!str || str.length <= length) return str;
    return `${str.substring(0, length / 2)}...${str.substring(str.length - length / 2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-[#0a0f1c]/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i className="las la-file-invoice-dollar text-2xl"></i>
            </div>
            Transactions
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 font-medium">
            Real-time blockchain payments and invoice history.
          </p>
        </div>
        
        <div className="w-full md:w-auto flex items-center relative z-10">
          <i className="las la-search absolute left-4 text-gray-400 dark:text-slate-500 text-lg"></i>
          <input 
            type="text" 
            placeholder="Search TxID or User ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0f1c] rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Date Processed</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Transaction ID</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">User / Tier</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Amount / Network</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500 dark:text-slate-400">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="las la-inbox text-4xl opacity-50 block"></i>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">No transactions found</p>
                    <p className="text-sm">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatDate(tx.processedAt)}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${tx.network === 'BEP20' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        {tx.network} Network
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                          {truncate(tx.id, 16)}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(tx.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-500 transition-colors"
                          title="Copy TxID"
                        >
                          <i className="las la-copy text-lg"></i>
                        </button>
                      </div>
                      {tx.isTestTransaction && (
                        <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 tracking-widest uppercase">
                          Test Tx
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                          <i className="las la-user text-gray-500"></i>
                        </div>
                        {truncate(tx.uid, 12)}
                      </div>
                      <span className={`inline-block mt-2 px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${
                        tx.tier === 'elite' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                        tx.tier === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
                      }`}>
                        {tx.tier}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        ${tx.amountUsd}
                      </div>
                      <div className="text-xs font-bold text-gray-500 dark:text-slate-500 mt-1 uppercase tracking-wider">
                        {tx.amountCrypto} {tx.tokenSymbol !== 'N/A' ? tx.tokenSymbol : tx.cryptoId.split('_')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedTx(tx)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        Details <i className="las la-angle-right text-base"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Premium Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-[#0a0f1c]/90 backdrop-blur-2xl w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 md:p-8 border-b border-gray-200/50 dark:border-white/5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
              
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <i className="las la-receipt text-2xl"></i>
                </div>
                Digital Receipt
              </h2>
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-slate-400 transition-colors relative z-10"
              >
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Transaction Hash</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-bold text-gray-900 dark:text-slate-200 break-all">{selectedTx.id}</p>
                      <button onClick={() => copyToClipboard(selectedTx.id)} className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-black/50 text-gray-400 hover:text-indigo-500 border border-gray-200 dark:border-white/5 shrink-0 transition-colors"><i className="las la-copy text-lg"></i></button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">User ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-slate-200">{selectedTx.uid}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Plan Tier</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white capitalize drop-shadow-sm">{selectedTx.tier}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Network / Token</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-200">{selectedTx.network} &bull; {selectedTx.tokenSymbol !== 'N/A' ? selectedTx.tokenSymbol : selectedTx.cryptoId}</p>
                  </div>
                  
                  <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1.5">Amount Verified</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">${selectedTx.amountUsd} USD</p>
                    <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-1">{selectedTx.amountCrypto} {selectedTx.tokenSymbol}</p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase border border-emerald-200 dark:border-emerald-500/20">
                      <i className="las la-check-circle text-base"></i> {selectedTx.status}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-gray-200/50 dark:border-white/5" />

              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <i className="las la-link text-indigo-500 text-lg"></i>
                Blockchain Metadata
              </h3>

              <div className="space-y-3 bg-gray-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-gray-200 dark:border-white/5 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Block Timestamp:</span>
                  <span className="text-sm font-mono font-medium text-gray-900 dark:text-slate-300">{formatDate(selectedTx.timestamp)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-gray-200 dark:border-white/5 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">From Address (Sender):</span>
                  <span className="text-xs font-mono font-medium text-gray-900 dark:text-slate-300 break-all">{selectedTx.fromAddress}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-gray-200 dark:border-white/5 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">To Address (Deposit):</span>
                  <span className="text-xs font-mono font-medium text-gray-900 dark:text-slate-300 break-all">{selectedTx.toAddress}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-gray-200 dark:border-white/5 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Transaction Fee:</span>
                  <span className="text-sm font-mono font-medium text-gray-900 dark:text-slate-300">{selectedTx.transactionFee}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">System Processed At:</span>
                  <span className="text-sm font-mono font-medium text-gray-900 dark:text-slate-300">{formatDate(selectedTx.processedAt)}</span>
                </div>
              </div>
              
              {selectedTx.isTestTransaction && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start dark:bg-amber-900/20 dark:border-amber-700/50">
                  <i className="las la-exclamation-triangle text-amber-500 text-xl mt-0.5"></i>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                    This was an authorized test micro-transaction. The payment was processed and the user's tier was upgraded, but the standard dollar amount validation was bypassed.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-200/50 dark:border-white/5 bg-gray-50/80 dark:bg-black/20 flex justify-end">
              <button 
                onClick={() => window.open(selectedTx.network === 'BEP20' || selectedTx.network === 'ERC20' ? `https://bscscan.com/tx/${selectedTx.id}` : `https://tronscan.org/#/transaction/${selectedTx.id}`, '_blank')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs tracking-widest font-black uppercase rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
              >
                View on Explorer <i className="las la-external-link-alt text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
