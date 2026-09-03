"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, doc, addDoc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PaymentMethod, Transaction, CouponCode, UserDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<"gateways" | "ledger" | "promotions">("gateways");
  const [loading, setLoading] = useState(true);

  // Data States
  const [gateways, setGateways] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<CouponCode[]>([]);

  // Search logic for Promo Modal
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ uid: string; username: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [gatewayModal, setGatewayModal] = useState<{ isOpen: boolean; mode: "add" | "edit"; data: Partial<PaymentMethod> | null }>({ isOpen: false, mode: "add", data: null });
  const [promoModal, setPromoModal] = useState<{ isOpen: boolean; mode: "add" | "edit"; data: Partial<CouponCode> | null }>({ isOpen: false, mode: "add", data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { where, limit } = await import("firebase/firestore");
        const q = query(
          collection(db, "users"), 
          where("username", ">=", searchQuery),
          where("username", "<=", searchQuery + '\uf8ff'),
          limit(5)
        );
        const snap = await getDocs(q);
        setSearchResults(snap.docs.map(d => ({ uid: d.id, username: d.data().username || d.data().email || 'Unknown User' })));
      } catch (error) {
        console.error("Error searching users", error);
      }
      setIsSearching(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "gateways") {
        const snap = await getDocs(query(collection(db, "payment_methods")));
        setGateways(snap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethod)));
      } 
      else if (activeTab === "ledger") {
        const tSnap = await getDocs(query(collection(db, "transactions")));
        const uSnap = await getDocs(query(collection(db, "users")));
        
        const users: Record<string, string> = {};
        uSnap.docs.forEach(d => { users[d.id] = (d.data() as UserDoc).email; });
        
        const txs = tSnap.docs.map(d => {
          const t = d.data();
          return { ...t, id: d.id, userEmail: users[t.user_id || t.uid] || t.user_id || t.uid };
        }) as any[];
        txs.sort((a, b) => {
          const dateA = a.created_at || a.timestamp;
          const dateB = b.created_at || b.timestamp;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        setTransactions(txs);
      }
      else if (activeTab === "promotions") {
        const snap = await getDocs(query(collection(db, "coupon_codes")));
        setPromotions(snap.docs.map(d => ({ ...d.data(), id: d.id } as CouponCode)));
      }
    } catch (error) {
      console.error("Failed to load billing data:", error);
      toast.error("Failed to load data for " + activeTab);
    } finally {
      setLoading(false);
    }
  };

  // Gateway Actions
  const handleGatewaySubmit = async () => {
    if (!gatewayModal.data?.name || !gatewayModal.data?.depositAddress) {
      toast.error("Name and Address are required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (gatewayModal.mode === "add") {
        await addDoc(collection(db, "payment_methods"), { ...gatewayModal.data, isActive: true });
        toast.success("Gateway added");
      } else if (gatewayModal.data.id) {
        await updateDoc(doc(db, "payment_methods", gatewayModal.data.id), gatewayModal.data);
        toast.success("Gateway updated");
      }
      setGatewayModal({ isOpen: false, mode: "add", data: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGateway = async (gw: PaymentMethod) => {
    try {
      await updateDoc(doc(db, "payment_methods", gw.id!), { isActive: !gw.isActive });
      fetchData();
      toast.success(`Gateway ${!gw.isActive ? 'activated' : 'paused'}`);
    } catch (error: any) {
      toast.error("Failed to toggle gateway");
    }
  };

  // Promo Actions
  const handlePromoSubmit = async () => {
    if (!promoModal.data?.code || !promoModal.data?.discount_pct) {
      toast.error("Code and discount are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        code: promoModal.data.code.toUpperCase(),
        discount_pct: Number(promoModal.data.discount_pct),
        is_active: promoModal.data.is_active ?? true,
        target_plans: promoModal.data.target_plans || ["ALL"],
        target_users: promoModal.data.target_users || "ALL"
      };

      if (promoModal.mode === "add") {
        await addDoc(collection(db, "coupon_codes"), payload);
        toast.success("Promotion created");
      } else if (promoModal.data.id) {
        await updateDoc(doc(db, "coupon_codes", promoModal.data.id), payload);
        toast.success("Promotion updated");
      }
      setPromoModal({ isOpen: false, mode: "add", data: null });
      setSearchQuery("");
      setSearchResults([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await deleteDoc(doc(db, "coupon_codes", id));
      toast.success("Promotion deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete promotion");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header & Tabs */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Billing & Payments</h1>
        <p className="text-sm text-secondary mt-1 mb-6">
          Manage crypto receiving wallets, verify transactions, and configure promotion engines.
        </p>
        
        <div className="flex border-b border-default gap-6">
          {[
            { id: "gateways", label: "Crypto Gateways", icon: "la-wallet" },
            { id: "ledger", label: "Transaction Ledger", icon: "la-file-invoice-dollar" },
            { id: "promotions", label: "Promotions Engine", icon: "la-tag" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === tab.id 
                  ? "text-blue-400 border-blue-500" 
                  : "text-muted border-transparent hover:text-neutral-300"
              }`}
            >
              <i className={`las ${tab.icon} text-lg`}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner className="w-10 h-10 border-blue-500" />
        </div>
      ) : (
        <>
          {/* TAB 1: CRYPTO GATEWAYS */}
          {activeTab === "gateways" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => setGatewayModal({ isOpen: true, mode: "add", data: { name: "", symbol: "", network: "", depositAddress: "" } })}
                  className="btn-primary flex items-center gap-2"
                >
                  <i className="las la-plus"></i> Add Gateway
                </button>
              </div>

              {gateways.length === 0 ? (
                <div className="premium-card p-12 text-center text-muted font-bold">No crypto gateways configured.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gateways.map(gw => (
                    <div key={gw.id} className="premium-card p-5 relative overflow-hidden group">
                      <div className={`absolute top-0 left-0 w-full h-1 ${gw.isActive ? 'bg-emerald-500' : 'bg-neutral-600'}`}></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#121212] border border-default flex items-center justify-center text-xl text-secondary overflow-hidden">
                            {gw.logo ? (
                              <img src={gw.logo} alt={gw.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <i className="lab la-bitcoin"></i>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-white leading-tight">{gw.name}</h3>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{gw.symbol} • {gw.network}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleGateway(gw)}
                          className={`w-10 h-6 rounded-full transition-colors relative ${gw.isActive ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${gw.isActive ? 'left-5' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="premium-inner-box p-3 mb-4">
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Deposit Address</div>
                        <div className="flex items-center gap-2 justify-between">
                          <div className="font-mono text-xs text-neutral-300 break-all">{gw.depositAddress}</div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(gw.depositAddress);
                              toast.success("Address copied");
                            }}
                            className="btn-ghost w-7 h-7 flex-shrink-0 flex items-center justify-center hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                            title="Copy Address"
                          >
                            <i className="las la-copy text-lg"></i>
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => setGatewayModal({ isOpen: true, mode: "edit", data: gw })}
                        className="btn-ghost w-full py-2 flex items-center justify-center gap-2 text-xs"
                      >
                        <i className="las la-pen"></i> Edit Wallet
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRANSACTION LEDGER */}
          {activeTab === "ledger" && (
            <div className="premium-card p-0 overflow-hidden">
              <div className="bg-[#121212] border-b border-default p-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Global Transactions</h2>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#1a1a1a] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Plan Tier</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">TxHash / Network</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">No transactions found.</td></tr>
                    ) : (
                      transactions.map(tx => {
                        const txDate = tx.created_at?.toDate ? tx.created_at.toDate() : (tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.created_at || tx.timestamp));
                        const txId = tx.transaction_id || tx.txid || "";
                        
                        return (
                          <tr key={tx.id} className="hover:bg-[#121212]/50 transition-colors">
                            <td className="px-6 py-4 text-secondary">
                              {txDate.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 font-bold text-white">{(tx.user_id || tx.uid)?.substring(0,10)}...</td>
                            <td className="px-6 py-4">
                              <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {tx.tier}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-emerald-400 font-bold">${tx.amount?.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <a href={`https://tronscan.org/#/transaction/${txId}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 font-mono text-xs flex items-center gap-1">
                                {txId.substring(0,12)}...<i className="las la-external-link-alt"></i>
                              </a>
                              <div className="text-[10px] text-muted uppercase font-bold mt-1">{tx.cryptoId || tx.payment_method || "Crypto"}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {(tx.status === "verified" || tx.status === "completed") && <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-end gap-1"><i className="las la-check-circle text-base"></i> Verified</span>}
                              {tx.status === "pending" && <span className="text-amber-400 font-bold text-xs uppercase tracking-widest flex items-center justify-end gap-1"><i className="las la-clock text-base"></i> Pending</span>}
                              {tx.status === "failed" && <span className="text-rose-400 font-bold text-xs uppercase tracking-widest flex items-center justify-end gap-1"><i className="las la-times-circle text-base"></i> Failed</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROMOTIONS */}
          {activeTab === "promotions" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => setPromoModal({ isOpen: true, mode: "add", data: { code: "", discount_pct: 10, is_active: true } })}
                  className="btn-primary flex items-center gap-2"
                >
                  <i className="las la-plus"></i> Generate Code
                </button>
              </div>

              <div className="premium-card p-0 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#1a1a1a] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Discount</th>
                        <th className="px-6 py-4">Target Plans</th>
                        <th className="px-6 py-4">Target Users</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {promotions.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">No active promotions.</td></tr>
                      ) : (
                        promotions.map(promo => (
                          <tr key={promo.id} className="hover:bg-[#121212]/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-xl text-white tracking-widest">{promo.code}</td>
                            <td className="px-6 py-4 font-bold text-emerald-400">{promo.discount_pct}% OFF</td>
                            <td className="px-6 py-4 text-secondary text-sm">{(promo.target_plans || []).join(', ')}</td>
                            <td className="px-6 py-4">
                              {promo.target_users === "ALL" ? (
                                <span className="text-secondary text-sm">All Users</span>
                              ) : (
                                <div className="flex gap-1 flex-wrap">
                                  {Array.isArray(promo.target_users) && promo.target_users.map(u => (
                                    <span key={u.uid} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full">{u.username}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {promo.is_active 
                                ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>
                                : <span className="bg-neutral-800 text-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Paused</span>
                              }
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setPromoModal({ isOpen: true, mode: "edit", data: promo })}
                                  className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center"
                                  title="Edit Promotion"
                                >
                                  <i className="las la-pen text-xl"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeletePromo(promo.id!)}
                                  className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                  title="Delete Promotion"
                                >
                                  <i className="las la-trash text-xl"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Gateway Modal */}
      {gatewayModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 border border-default">
            <h2 className="text-xl font-bold text-white mb-6">
              {gatewayModal.mode === "add" ? "Add Crypto Gateway" : "Edit Gateway"}
            </h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={gatewayModal.data?.name || ""}
                  onChange={e => setGatewayModal({ ...gatewayModal, data: { ...gatewayModal.data!, name: e.target.value } })}
                  className="input-premium w-full bg-[#121212] border-default"
                  placeholder="e.g. Tether (USDT)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Symbol</label>
                  <input 
                    type="text" 
                    value={gatewayModal.data?.symbol || ""}
                    onChange={e => setGatewayModal({ ...gatewayModal, data: { ...gatewayModal.data!, symbol: e.target.value.toUpperCase() } })}
                    className="input-premium w-full bg-[#121212] border-default uppercase"
                    placeholder="USDT"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Network</label>
                  <input 
                    type="text" 
                    value={gatewayModal.data?.network || ""}
                    onChange={e => setGatewayModal({ ...gatewayModal, data: { ...gatewayModal.data!, network: e.target.value } })}
                    className="input-premium w-full bg-[#121212] border-default"
                    placeholder="TRC20"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Deposit Address (Wallet)</label>
                <input 
                  type="text" 
                  value={gatewayModal.data?.depositAddress || ""}
                  onChange={e => setGatewayModal({ ...gatewayModal, data: { ...gatewayModal.data!, depositAddress: e.target.value } })}
                  className="input-premium w-full bg-[#121212] border-default font-mono text-sm"
                  placeholder="T..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Logo URL (Optional)</label>
                <input 
                  type="text" 
                  value={gatewayModal.data?.logo || ""}
                  onChange={e => setGatewayModal({ ...gatewayModal, data: { ...gatewayModal.data!, logo: e.target.value } })}
                  className="input-premium w-full bg-[#121212] border-default text-sm"
                  placeholder="https://example.com/usdt.png"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-default">
              <button onClick={() => setGatewayModal({ isOpen: false, mode: "add", data: null })} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
              <button onClick={handleGatewaySubmit} className="btn-primary" disabled={isSubmitting}>Save Gateway</button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Modal */}
      {promoModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 border border-default">
            <h2 className="text-xl font-bold text-white mb-6">
              {promoModal.mode === "add" ? "Create Promotion Code" : "Edit Promotion"}
            </h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Discount Code</label>
                <input 
                  type="text" 
                  value={promoModal.data?.code || ""}
                  onChange={e => setPromoModal({ ...promoModal, data: { ...promoModal.data!, code: e.target.value.toUpperCase() } })}
                  className="input-premium w-full bg-[#121212] border-default font-mono tracking-widest uppercase text-xl"
                  placeholder="BLACKFRIDAY50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Discount Percentage (%)</label>
                <input 
                  type="number" 
                  value={promoModal.data?.discount_pct || 0}
                  onChange={e => setPromoModal({ ...promoModal, data: { ...promoModal.data!, discount_pct: Number(e.target.value) } })}
                  className="input-premium w-full bg-[#121212] border-default"
                  min="1" max="100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Target Plans</label>
                <div className="flex gap-4 flex-wrap">
                  {["ALL", "STARTER", "PRO", "ELITE"].map(plan => (
                    <label key={plan} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(promoModal.data?.target_plans || []).includes(plan as any)}
                        onChange={(e) => {
                          let plans = [...(promoModal.data?.target_plans || [])];
                          if (e.target.checked) plans.push(plan as any);
                          else plans = plans.filter(p => p !== plan);
                          setPromoModal({...promoModal, data: { ...promoModal.data!, target_plans: plans }});
                        }}
                        className="w-4 h-4 rounded border-neutral-600 bg-[#0a0a0a] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      {plan}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Target Users</label>
                <select 
                  value={promoModal.data?.target_users === "ALL" ? "ALL" : "SPECIFIC"}
                  onChange={e => setPromoModal({...promoModal, data: { ...promoModal.data!, target_users: e.target.value === "ALL" ? "ALL" : [] }})}
                  className="input-premium w-full bg-[#121212] border-default font-bold text-secondary mb-2"
                >
                  <option value="ALL">All Users</option>
                  <option value="SPECIFIC">Specific Users</option>
                </select>

                {promoModal.data?.target_users !== "ALL" && (
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search user by username..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-premium w-full bg-[#0a0a0a] border-default text-sm" 
                    />
                    {isSearching && <i className="las la-spinner la-spin absolute right-3 top-2.5 text-muted"></i>}
                    
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-default rounded-lg shadow-xl overflow-hidden z-20">
                        {searchResults.map(user => (
                          <button
                            key={user.uid}
                            onClick={() => {
                              const targets = promoModal.data?.target_users;
                              if (Array.isArray(targets)) {
                                const exists = targets.find(u => u.uid === user.uid);
                                if (!exists) {
                                  setPromoModal({
                                    ...promoModal,
                                    data: { ...promoModal.data!, target_users: [...targets, user] }
                                  });
                                }
                              }
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm"
                          >
                            {user.username}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {Array.isArray(promoModal.data?.target_users) && promoModal.data!.target_users.map(u => (
                        <span key={u.uid} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                          {u.username}
                          <i className="las la-times cursor-pointer hover:text-rose-400 text-sm ml-1" onClick={() => {
                            const targets = promoModal.data?.target_users;
                            if (Array.isArray(targets)) {
                              setPromoModal({...promoModal, data: { ...promoModal.data!, target_users: targets.filter((x: any) => x.uid !== u.uid) }});
                            }
                          }}></i>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-default">
                <input 
                  type="checkbox" 
                  id="promoActive"
                  checked={promoModal.data?.is_active ?? true}
                  onChange={e => setPromoModal({ ...promoModal, data: { ...promoModal.data!, is_active: e.target.checked } })}
                  className="w-4 h-4 rounded border-strong bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
                />
                <label htmlFor="promoActive" className="text-sm font-bold text-neutral-300">Code is Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-default">
              <button onClick={() => setPromoModal({ isOpen: false, mode: "add", data: null })} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
              <button onClick={handlePromoSubmit} className="btn-primary" disabled={isSubmitting}>Save Code</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
