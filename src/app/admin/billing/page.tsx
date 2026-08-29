"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc, query, where, limit } from "firebase/firestore";
import { PaymentMethod, AutoDiscount, CouponCode, Transaction } from "@/lib/firebase/schema";
import { QRCodeSVG } from 'qrcode.react';

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<"gateways" | "promotions" | "ledger">("gateways");
  
  // Data States
  const [gateways, setGateways] = useState<PaymentMethod[]>([]);
  const [autoDiscounts, setAutoDiscounts] = useState<AutoDiscount[]>([]);
  const [couponCodes, setCouponCodes] = useState<CouponCode[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Form States - Gateways
  const [newGateway, setNewGateway] = useState<Partial<PaymentMethod>>({ name: "", network: "", symbol: "", depositAddress: "", isActive: true });
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);

  // Form States - Promos (Auto & Coupon)
  const [newAutoDiscount, setNewAutoDiscount] = useState<AutoDiscount>({ name: "", discount_pct: 0, target_plans: [], target_users: "ALL", is_active: true });
  const [newCouponCode, setNewCouponCode] = useState<CouponCode>({ code: "", discount_pct: 0, target_plans: [], target_users: "ALL", is_active: true });
  const [isAutoDiscountModalOpen, setIsAutoDiscountModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // User Search Autocomplete States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ uid: string; username: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const gSnap = await getDocs(collection(db, "payment_methods"));
      setGateways(gSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethod)));

      const autoSnap = await getDocs(collection(db, "auto_discounts"));
      setAutoDiscounts(autoSnap.docs.map(d => ({ id: d.id, ...d.data() } as AutoDiscount)));

      const couponSnap = await getDocs(collection(db, "coupon_codes"));
      setCouponCodes(couponSnap.docs.map(d => ({ id: d.id, ...d.data() } as CouponCode)));

      const tSnap = await getDocs(collection(db, "transactions"));
      setTransactions(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  // User Search Logic
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
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

  // Gateway Handlers
  const handleAddGateway = async () => {
    if (!newGateway.name || !newGateway.depositAddress) return;
    try {
      const docRef = await addDoc(collection(db, "payment_methods"), newGateway);
      setGateways([...gateways, { id: docRef.id, ...newGateway } as PaymentMethod]);
      setIsGatewayModalOpen(false);
      setNewGateway({ name: "", network: "", symbol: "", depositAddress: "", isActive: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGateway = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "payment_methods", id), { isActive: !currentStatus });
      setGateways(gateways.map(g => g.id === id ? { ...g, isActive: !currentStatus } : g));
    } catch (e) {
      console.error(e);
    }
  };

  // Promo Handlers
  const handleAddAutoDiscount = async () => {
    if (!newAutoDiscount.name || newAutoDiscount.discount_pct <= 0) return;
    try {
      const docRef = await addDoc(collection(db, "auto_discounts"), newAutoDiscount);
      setAutoDiscounts([...autoDiscounts, { id: docRef.id, ...newAutoDiscount }]);
      setIsAutoDiscountModalOpen(false);
      setNewAutoDiscount({ name: "", discount_pct: 0, target_plans: [], target_users: "ALL", is_active: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAutoDiscount = async (id: string) => {
    try {
      await deleteDoc(doc(db, "auto_discounts", id));
      setAutoDiscounts(autoDiscounts.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCoupon = async () => {
    if (!newCouponCode.code || newCouponCode.discount_pct <= 0) return;
    try {
      const docRef = await addDoc(collection(db, "coupon_codes"), newCouponCode);
      setCouponCodes([...couponCodes, { id: docRef.id, ...newCouponCode }]);
      setIsCouponModalOpen(false);
      setNewCouponCode({ code: "", discount_pct: 0, target_plans: [], target_users: "ALL", is_active: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, "coupon_codes", id));
      setCouponCodes(couponCodes.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Billing & Payments</h1>
        <p className="text-neutral-400 mt-1">Manage gateways, promotions, and view the transaction ledger.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800">
        <button 
          onClick={() => setActiveTab("gateways")}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === "gateways" ? "border-blue-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <i className="las la-wallet mr-2"></i> Gateways
        </button>
        <button 
          onClick={() => setActiveTab("promotions")}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === "promotions" ? "border-blue-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <i className="las la-tags mr-2"></i> Promotions
        </button>
        <button 
          onClick={() => setActiveTab("ledger")}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === "ledger" ? "border-blue-500 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <i className="las la-list mr-2"></i> Ledger
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        
        {/* GATEWAYS TAB */}
        {activeTab === "gateways" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Payment Gateways</h2>
              <button onClick={() => setIsGatewayModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                + Add Gateway
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gateways.map(g => (
                <div key={g.id} className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col relative">
                  
                  {/* Status Toggle */}
                  <div className="absolute top-4 right-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={g.isActive} 
                        onChange={() => handleToggleGateway(g.id!, g.isActive)} 
                      />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    {g.logo ? (
                      <img src={g.logo} alt={g.symbol} className="w-10 h-10 rounded-full object-contain bg-white/10 p-1" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center font-bold">{g.symbol.substring(0, 4)}</div>
                    )}
                    <div>
                      <h3 className="text-white font-bold">{g.name}</h3>
                      <p className="text-xs text-neutral-400 uppercase tracking-widest">{g.network} Network</p>
                    </div>
                  </div>

                  <div className="bg-[#121212] border border-neutral-800 rounded-lg p-3 flex justify-between items-center mb-4">
                    <span className="text-xs text-neutral-300 font-mono truncate mr-2">{g.depositAddress}</span>
                    <button onClick={() => navigator.clipboard.writeText(g.depositAddress)} className="text-blue-500 hover:text-blue-400 shrink-0"><i className="las la-copy text-lg"></i></button>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    <div className="relative group">
                      <button className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer">
                        <i className="las la-qrcode"></i> View QR
                      </button>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 bg-white p-2 rounded-xl shadow-xl border border-neutral-200 pointer-events-none">
                        <QRCodeSVG value={g.depositAddress} size={150} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-rose-500 hover:text-rose-400"><i className="las la-trash text-lg"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Gateway Modal */}
            {isGatewayModalOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Add Payment Gateway</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Name (e.g. Tether USDT)" value={newGateway.name} onChange={e => setNewGateway({...newGateway, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Network (e.g. TRC20)" value={newGateway.network} onChange={e => setNewGateway({...newGateway, network: e.target.value})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Symbol (e.g. USDT)" value={newGateway.symbol} onChange={e => setNewGateway({...newGateway, symbol: e.target.value})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Logo URL (optional)" value={newGateway.logo || ""} onChange={e => setNewGateway({...newGateway, logo: e.target.value})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    <input type="text" placeholder="Wallet Address" value={newGateway.depositAddress} onChange={e => setNewGateway({...newGateway, depositAddress: e.target.value})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2 font-mono text-sm" />
                    <div className="flex justify-end gap-3 pt-4">
                      <button onClick={() => setIsGatewayModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                      <button onClick={handleAddGateway} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold">Save Gateway</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROMOTIONS TAB */}
        {activeTab === "promotions" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Auto-Discounts Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><i className="las la-bolt text-amber-500"></i> Auto-Discounts (Global Sales)</h2>
                <button onClick={() => setIsAutoDiscountModalOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  + Create Sale
                </button>
              </div>
              <div className="bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#0a0a0a] border-b border-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Sale Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Discount</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Plans</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {autoDiscounts.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                        <td className="px-6 py-4"><span className="text-amber-400 font-bold">{p.discount_pct}% OFF</span></td>
                        <td className="px-6 py-4 text-neutral-400 text-sm">{p.target_plans.join(', ')}</td>
                        <td className="px-6 py-4">
                          {p.is_active ? <span className="text-emerald-500 text-xs font-bold">ACTIVE</span> : <span className="text-neutral-500 text-xs font-bold">PAUSED</span>}
                          {p.expires_at && (
                            <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                              Expires: {new Date(p.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteAutoDiscount(p.id!)} className="text-rose-500 hover:text-rose-400 p-2"><i className="las la-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                    {autoDiscounts.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No active sales.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual Coupons Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><i className="las la-ticket-alt text-blue-500"></i> Manual Coupons</h2>
                <button onClick={() => setIsCouponModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  + Create Coupon
                </button>
              </div>
              <div className="bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#0a0a0a] border-b border-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Code</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Discount</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Plans</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Target Users</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {couponCodes.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-white">{p.code}</td>
                        <td className="px-6 py-4"><span className="text-emerald-400 font-bold">{p.discount_pct}% OFF</span></td>
                        <td className="px-6 py-4 text-neutral-400 text-sm">{p.target_plans.join(', ')}</td>
                        <td className="px-6 py-4">
                          {p.target_users === "ALL" ? (
                            <span className="text-neutral-400 text-sm">All Users</span>
                          ) : (
                            <div className="flex gap-1 flex-wrap">
                              {p.target_users.map(u => (
                                <span key={u.uid} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{u.username}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {p.is_active ? <span className="text-emerald-500 text-xs font-bold">ACTIVE</span> : <span className="text-neutral-500 text-xs font-bold">PAUSED</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteCoupon(p.id!)} className="text-rose-500 hover:text-rose-400 p-2"><i className="las la-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                    {couponCodes.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No active coupons.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auto-Discount Modal */}
            {isAutoDiscountModalOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Create Auto-Discount</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Sale Name (e.g. Black Friday)" value={newAutoDiscount.name} onChange={e => setNewAutoDiscount({...newAutoDiscount, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    <input type="number" placeholder="Discount %" value={newAutoDiscount.discount_pct || ""} onChange={e => setNewAutoDiscount({...newAutoDiscount, discount_pct: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    
                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase mb-2 block">Expiration Date (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={newAutoDiscount.expires_at || ""} 
                        onChange={e => setNewAutoDiscount({...newAutoDiscount, expires_at: e.target.value || null})} 
                        className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase mb-2 block">Target Plans</label>
                      <div className="flex gap-4">
                        {["ALL", "STARTER", "PRO", "ELITE"].map(plan => (
                          <label key={plan} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newAutoDiscount.target_plans.includes(plan as any)}
                              onChange={(e) => {
                                let plans = [...newAutoDiscount.target_plans];
                                if (e.target.checked) plans.push(plan as any);
                                else plans = plans.filter(p => p !== plan);
                                setNewAutoDiscount({...newAutoDiscount, target_plans: plans});
                              }}
                              className="w-4 h-4 rounded border-neutral-600 bg-[#0a0a0a] text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0"
                            />
                            {plan}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button onClick={() => setIsAutoDiscountModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                      <button onClick={handleAddAutoDiscount} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold">Save Sale</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coupon Modal */}
            {isCouponModalOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Create Manual Coupon</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Code (e.g. VIPFREE)" value={newCouponCode.code} onChange={e => setNewCouponCode({...newCouponCode, code: e.target.value.toUpperCase()})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2 font-mono uppercase" />
                    <input type="number" placeholder="Discount %" value={newCouponCode.discount_pct || ""} onChange={e => setNewCouponCode({...newCouponCode, discount_pct: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" />
                    
                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase mb-2 block">Target Plans</label>
                      <div className="flex gap-4">
                        {["ALL", "STARTER", "PRO", "ELITE"].map(plan => (
                          <label key={plan} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newCouponCode.target_plans.includes(plan as any)}
                              onChange={(e) => {
                                let plans = [...newCouponCode.target_plans];
                                if (e.target.checked) plans.push(plan as any);
                                else plans = plans.filter(p => p !== plan);
                                setNewCouponCode({...newCouponCode, target_plans: plans});
                              }}
                              className="w-4 h-4 rounded border-neutral-600 bg-[#0a0a0a] text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0"
                            />
                            {plan}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase mb-2 block">Target Users</label>
                      <select 
                        value={newCouponCode.target_users === "ALL" ? "ALL" : "SPECIFIC"}
                        onChange={e => setNewCouponCode({...newCouponCode, target_users: e.target.value === "ALL" ? "ALL" : []})}
                        className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2 mb-2"
                      >
                        <option value="ALL">All Users</option>
                        <option value="SPECIFIC">Specific Users</option>
                      </select>

                      {newCouponCode.target_users !== "ALL" && (
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search user by username..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-neutral-800 text-white rounded-lg px-3 py-2" 
                          />
                          {isSearching && <i className="las la-spinner la-spin absolute right-3 top-2.5 text-neutral-500"></i>}
                          
                          {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-20">
                              {searchResults.map(user => (
                                <button
                                  key={user.uid}
                                  onClick={() => {
                                    if (Array.isArray(newCouponCode.target_users)) {
                                      const exists = newCouponCode.target_users.find(u => u.uid === user.uid);
                                      if (!exists) {
                                        setNewCouponCode({
                                          ...newCouponCode,
                                          target_users: [...newCouponCode.target_users, user]
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
                            {Array.isArray(newCouponCode.target_users) && newCouponCode.target_users.map(u => (
                              <span key={u.uid} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                {u.username}
                                <i className="las la-times cursor-pointer hover:text-rose-400" onClick={() => {
                                  if (Array.isArray(newCouponCode.target_users)) {
                                    setNewCouponCode({...newCouponCode, target_users: newCouponCode.target_users.filter(x => x.uid !== u.uid)});
                                  }
                                }}></i>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button onClick={() => setIsCouponModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                      <button onClick={handleAddCoupon} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold">Save Coupon</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEDGER TAB */}
        {activeTab === "ledger" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-white">Transaction Ledger</h2>
            <div className="bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#0a0a0a] border-b border-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">User UID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Tier</th>
                    <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">TxID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-neutral-400">
                        {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-neutral-300">{t.uid?.substring(0,10)}...</td>
                      <td className="px-6 py-4 text-sm font-bold text-white uppercase">{t.tier}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-400">${t.amount?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <a href={`https://tronscan.org/#/transaction/${t.txid}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 font-mono text-xs flex items-center gap-1">
                          {t.txid?.substring(0,12)}...<i className="las la-external-link-alt"></i>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {t.status === "verified" && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-full border border-emerald-500/20">Verified</span>}
                        {t.status === "pending" && <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded-full border border-amber-500/20">Pending</span>}
                        {t.status === "failed" && <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase rounded-full border border-rose-500/20">Failed</span>}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No transactions recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
