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
                  <tr key={tx.id} className="hover:bg-elevated transition-colors group">
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
                        <span className="font-mono text-sm font-medium text-primary bg-elevated px-2.5 py-1 rounded-lg border border-default">
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
                      <div className="text-base font-bold text-success">
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

      {/* Transaction Details Premium Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-subtle flex justify-between items-center bg-elevated">
              <h2 className="text-xl font-bold text-primary flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info-bg border border-info/20 flex items-center justify-center text-info">
                  <i className="las la-receipt text-2xl"></i>
                </div>
                Digital Receipt
              </h2>
              <button 
                onClick={() => { setSelectedTx(null); setIsEditing(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-elevated text-muted hover:text-primary transition-colors border border-default"
              >
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-elevated p-4 rounded-xl border border-default">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Transaction Hash</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-bold text-primary break-all">{selectedTx.id}</p>
                      <button onClick={() => copyToClipboard(selectedTx.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface text-muted hover:text-info border border-default shrink-0 transition-colors"><i className="las la-copy text-lg"></i></button>
                    </div>
                  </div>
                  
                  <div className="bg-elevated p-4 rounded-xl border border-default">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">User ID</p>
                    <p className="font-mono text-sm text-primary">{selectedTx.uid}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Plan Tier</p>
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

                <div className="space-y-4">
                  <div className="bg-elevated p-4 rounded-xl border border-default">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Network / Token</p>
                    <p className="text-sm font-bold text-primary">{selectedTx.network} &bull; {selectedTx.tokenSymbol !== 'N/A' ? selectedTx.tokenSymbol : selectedTx.cryptoId}</p>
                  </div>
                  
                  <div className="bg-success-bg p-4 rounded-xl border border-success/20">
                    <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1.5">Amount Verified</p>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editData.amountUsd !== undefined ? editData.amountUsd : ''}
                        onChange={e => setEditData(prev => ({...prev, amountUsd: Number(e.target.value)}))}
                        className="w-full bg-surface border border-success/30 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-success text-success mt-1"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-success">${selectedTx.amountUsd} USD</p>
                    )}
                    <p className="text-xs font-bold text-success/70 mt-1">{selectedTx.amountCrypto} {selectedTx.tokenSymbol}</p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Status</p>
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

              <hr className="my-6 border-subtle" />

              <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-widest">
                <i className="las la-link text-info text-lg"></i>
                Blockchain Metadata
              </h3>

              <div className="space-y-3 bg-elevated p-5 rounded-xl border border-default">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-subtle pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Block Timestamp:</span>
                  <span className="text-sm font-mono font-medium text-primary">{formatDate(selectedTx.timestamp)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-subtle pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">From Address (Sender):</span>
                  <span className="text-xs font-mono font-medium text-primary break-all">{selectedTx.fromAddress}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-subtle pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">To Address (Deposit):</span>
                  <span className="text-xs font-mono font-medium text-primary break-all">{selectedTx.toAddress}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-subtle pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Transaction Fee:</span>
                  <span className="text-sm font-mono font-medium text-primary">{selectedTx.transactionFee}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">System Processed At:</span>
                  <span className="text-sm font-mono font-medium text-primary">{formatDate(selectedTx.processedAt)}</span>
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
            
            <div className="p-4 md:p-5 border-t border-subtle bg-elevated flex flex-col md:flex-row justify-between items-center gap-4">
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                {!isEditing ? (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => { setIsEditing(true); setEditData(selectedTx); }}
                      leftIcon={<i className="las la-pen text-base"></i>}
                      className="flex-1 md:flex-none"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handleDelete(selectedTx.id)} 
                      leftIcon={<i className="las la-trash text-base"></i>}
                      className="flex-1 md:flex-none"
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="primary"
                      onClick={handleSaveEdit} 
                      leftIcon={<i className="las la-save text-base"></i>}
                      className="flex-1 md:flex-none"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(false)} 
                      className="flex-1 md:flex-none"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>

              <Button 
                variant="secondary"
                onClick={() => window.open(selectedTx.network === 'BEP20' || selectedTx.network === 'ERC20' ? `https://bscscan.com/tx/${selectedTx.id}` : `https://tronscan.org/#/transaction/${selectedTx.id}`, '_blank')}
                rightIcon={<i className="las la-external-link-alt text-lg"></i>}
                className="w-full md:w-auto uppercase tracking-widest font-bold"
              >
                View on Explorer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
