"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction permanently?")) return;
    
    try {
      await deleteDoc(doc(db, "processed_txids", id));
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      setSelectedTx(null);
      toast.success("Transaction deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction.");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTx) return;
    
    try {
      const txRef = doc(db, "processed_txids", selectedTx.id);
      
      const updatePayload: any = {};
      if (editData.tier !== undefined) updatePayload.tier = editData.tier;
      if (editData.amountUsd !== undefined) updatePayload.amount = editData.amountUsd;
      if (editData.status !== undefined) updatePayload.status = editData.status;

      await updateDoc(txRef, updatePayload);
      
      setTransactions(prev => prev.map(tx => {
        if (tx.id === selectedTx.id) {
          return { ...tx, ...editData };
        }
        return tx;
      }));
      
      setSelectedTx(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
      toast.success("Transaction updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update transaction.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-subtle relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-info-bg flex items-center justify-center text-info border border-info/20">
              <i className="las la-file-invoice-dollar text-2xl"></i>
            </div>
            Transactions
          </h1>
          <p className="text-secondary text-sm mt-2 font-medium">
            Real-time blockchain payments and invoice history.
          </p>
        </div>
        
        <div className="w-full md:w-80 flex items-center relative z-10">
          <Input 
            placeholder="Search TxID or User ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<i className="las la-search text-lg"></i>}
          />
        </div>
      </div>

      <Card className="overflow-visible border-default">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-subtle">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">Date Processed</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">User / Tier</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted">Amount / Network</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-secondary">
                    <div className="w-20 h-20 bg-elevated rounded-full flex items-center justify-center mx-auto mb-4 border border-default">
                      <i className="las la-inbox text-4xl opacity-50 block"></i>
                    </div>
                    <p className="font-bold text-primary">No transactions found</p>
                    <p className="text-sm">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-primary">
                        {formatDate(tx.processedAt)}
                      </div>
                      <div className="text-xs font-medium text-muted mt-1 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${tx.network === 'BEP20' ? 'bg-warning' : 'bg-danger'}`}></span>
                        {tx.network} Network
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-500 bg-elevated px-2.5 py-1 rounded-lg border border-default">
                          {truncate(tx.id, 16)}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(tx.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted hover:text-info transition-colors"
                          title="Copy TxID"
                        >
                          <i className="las la-copy text-lg"></i>
                        </button>
                      </div>
                      {tx.isTestTransaction && (
                        <Badge variant="warning" size="sm" className="mt-2 uppercase">Test Tx</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-primary flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-elevated border border-default flex items-center justify-center">
                          <i className="las la-user text-muted"></i>
                        </div>
                        {truncate(tx.uid, 12)}
                      </div>
                      <div className="mt-2">
                        <Badge 
                          variant={tx.tier === 'elite' ? 'info' : tx.tier === 'pro' ? 'neutral' : 'free'} 
                          size="sm" 
                          className="uppercase"
                        >
                          {tx.tier}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-medium text-success">
                        ${tx.amountUsd}
                      </div>
                      <div className="text-xs font-bold text-muted mt-1 uppercase tracking-wider">
                        {tx.amountCrypto} {tx.tokenSymbol !== 'N/A' ? tx.tokenSymbol : tx.cryptoId.split('_')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedTx(tx)}
                        rightIcon={<i className="las la-angle-right text-base"></i>}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Detail Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-y-0 right-0 w-full max-w-xl bg-surface border-l border-subtle shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-6 border-b border-subtle bg-base">
              <h2 className="text-lg font-bold text-primary flex items-center gap-3">
                <div className="w-10 h-10 bg-info-bg text-info rounded-xl flex items-center justify-center border border-info/20">
                  <i className="las la-file-invoice text-xl"></i>
                </div>
                Transaction Details
              </h2>
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-10 h-10 bg-elevated hover:bg-subtle text-secondary hover:text-primary transition-colors rounded-full flex items-center justify-center"
              >
                <i className="las la-times text-xl"></i>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <i className="las la-user text-info text-lg"></i> User Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">User ID</p>
                    <p className="font-mono text-sm text-primary">{selectedTx.uid}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Plan Tier</p>
                    {isEditing ? (
                      <select 
                        value={editData.tier || 'free'}
                        onChange={e => setEditData(prev => ({...prev, tier: e.target.value}))}
                        className="w-full bg-surface border border-default rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-strong text-primary"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="elite">Elite</option>
                      </select>
                    ) : (
                      <Badge variant="neutral" size="sm" className="capitalize">{selectedTx.tier}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <i className="las la-wallet text-info text-lg"></i> Payment Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Amount Verified</p>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editData.amountUsd !== undefined ? editData.amountUsd : ''}
                        onChange={e => setEditData(prev => ({...prev, amountUsd: Number(e.target.value)}))}
                        className="w-full bg-surface border border-default rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-success text-success"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-xl font-medium text-success">${selectedTx.amountUsd} USD</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Crypto Received</p>
                    <p className="text-sm font-bold text-primary">{selectedTx.amountCrypto} {selectedTx.tokenSymbol}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Network / Token</p>
                    <p className="text-sm font-bold text-primary">{selectedTx.network} &bull; {selectedTx.tokenSymbol !== 'N/A' ? selectedTx.tokenSymbol : selectedTx.cryptoId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Status</p>
                    {isEditing ? (
                      <select 
                        value={editData.status || 'SUCCESS'}
                        onChange={e => setEditData(prev => ({...prev, status: e.target.value}))}
                        className="w-full bg-surface border border-default rounded-lg px-3 py-2 text-sm font-bold tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-strong text-primary"
                      >
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="PENDING">Pending</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    ) : (
                      <Badge 
                        variant={
                          selectedTx.status === 'SUCCESS' ? 'success' : 
                          selectedTx.status === 'FAILED' ? 'danger' : 'warning'
                        }
                      >
                        <i className={`las text-base mr-1 ${selectedTx.status === 'SUCCESS' ? 'la-check-circle' : 'la-exclamation-circle'}`}></i> {selectedTx.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <i className="las la-link text-info text-lg"></i> Blockchain Metadata
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Transaction Hash</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm text-primary break-all">{selectedTx.id}</p>
                      <button onClick={() => copyToClipboard(selectedTx.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors shrink-0"><i className="las la-copy text-lg"></i></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Block Timestamp</p>
                      <p className="font-mono text-sm text-primary">{formatDate(selectedTx.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">System Processed</p>
                      <p className="font-mono text-sm text-primary">{formatDate(selectedTx.processedAt)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">From Address</p>
                    <p className="font-mono text-xs text-primary break-all">{selectedTx.fromAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">To Address</p>
                    <p className="font-mono text-xs text-primary break-all">{selectedTx.toAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Transaction Fee</p>
                    <p className="font-mono text-sm text-primary">{selectedTx.transactionFee}</p>
                  </div>
                </div>
              </div>
              
              {selectedTx.isTestTransaction && (
                <div className="mt-4 p-4 bg-warning-bg border border-warning/30 rounded-xl flex gap-3 items-start">
                  <i className="las la-exclamation-triangle text-warning text-xl mt-0.5"></i>
                  <p className="text-xs text-warning leading-relaxed font-medium">
                    This was an authorized test micro-transaction. The payment was processed and the user's tier was upgraded, but the standard dollar amount validation was bypassed.
                  </p>
                </div>
              )}
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-subtle bg-surface/80 backdrop-blur-md sticky bottom-0 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="ghost"
                onClick={() => copyToClipboard(selectedTx.id)}
                leftIcon={<i className="las la-copy text-lg"></i>}
                className="w-full sm:flex-1"
              >
                Copy ID
              </Button>
              <Button 
                variant="primary"
                onClick={() => window.open(selectedTx.network === 'BEP20' || selectedTx.network === 'ERC20' ? `https://bscscan.com/tx/${selectedTx.id}` : `https://tronscan.org/#/transaction/${selectedTx.id}`, '_blank')}
                rightIcon={<i className="las la-external-link-alt text-lg"></i>}
                className="w-full sm:flex-1"
              >
                Explorer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
