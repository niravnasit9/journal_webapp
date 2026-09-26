"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, getDoc, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { IpoApplicationDoc, AccountDoc } from "@/lib/firebase/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

async function fetchUpcomingIpos() {
  const res = await fetch("/api/ipos");
  if (!res.ok) throw new Error("Failed to fetch IPOs");
  return await res.json();
}

async function fetchListedIpos() {
  const res = await fetch("/api/ipos-listed");
  if (!res.ok) throw new Error("Failed to fetch listed IPOs");
  return await res.json();
}

export default function IpoDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingIpos, setUpcomingIpos] = useState<any[]>([]);
  const [listedIpos, setListedIpos] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<IpoApplicationDoc[]>([]);
  const [userAccounts, setUserAccounts] = useState<AccountDoc[]>([]);
  const [ipoCategory, setIpoCategory] = useState<'MAINBOARD' | 'SME'>('MAINBOARD');
  const [statusCategory, setStatusCategory] = useState<'UPCOMING' | 'LISTED'>('UPCOMING');
  const hasFetched = React.useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'UPCOMING' | 'LISTED'>('UPCOMING');
  const [formData, setFormData] = useState({
    ipo_name: "",
    symbol: "",
    application_date: new Date().toISOString().split('T')[0],
    application_number: "",
    status: "Pending",
    lots_applied: 1,
    total_amount: 15000,

    // Listed IPO tracking fields
    applied_account_id: "",
    allotted_account_id: "",
    lots_allotted: 0,
    is_sold: false,
    sell_date: new Date().toISOString().split('T')[0],
    sell_price: 0,
    offer_price: 0,
    lot_size: 1
  });

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Upcoming IPOs & Listed IPOs
      const [ipos, listed] = await Promise.all([
        fetchUpcomingIpos(),
        fetchListedIpos()
      ]);
      setUpcomingIpos(ipos);
      setListedIpos(listed);

      // 2. Fetch My Applications
      const q = query(collection(db, "ipo_applications"), where("owner_uid", "==", user?.uid));
      const snap = await getDocs(q);
      const apps = snap.docs.map(doc => doc.data() as IpoApplicationDoc);

      // Sort by date descending
      apps.sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());
      setMyApplications(apps);

      // 3. Fetch User Accounts
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user?.uid));
      const accSnap = await getDocs(accQuery);
      const accounts = accSnap.docs
        .map(doc => doc.data() as AccountDoc)
        .filter(acc => acc.market_type === "DOMESTIC" || acc.currency === "INR");
      setUserAccounts(accounts);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load IPO data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newRef = doc(collection(db, "ipo_applications"));
      let profit_loss = 0;
      if (formData.is_sold) {
        profit_loss = (Number(formData.sell_price) - Number(formData.offer_price)) * (Number(formData.lot_size) * Number(formData.lots_allotted));
      }

      const payload: IpoApplicationDoc = {
        id: newRef.id,
        owner_uid: user.uid,
        ipo_name: formData.ipo_name,
        symbol: formData.symbol,
        application_date: formData.application_date,
        application_number: formData.application_number,
        status: formData.status as any,
        lots_applied: Number(formData.lots_applied),
        total_amount: Number(formData.total_amount),

        applied_account_id: formData.applied_account_id,
        allotted_account_id: formData.allotted_account_id,
        lots_allotted: Number(formData.lots_allotted),
        is_sold: formData.is_sold,
        sell_date: formData.sell_date,
        sell_price: Number(formData.sell_price),
        offer_price: Number(formData.offer_price),
        lot_size: Number(formData.lot_size),
        profit_loss: profit_loss,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await setDoc(newRef, payload);

      // Update Account Balance if Sold
      if (formData.is_sold && profit_loss !== 0 && formData.allotted_account_id) {
        const accRef = doc(db, "accounts", formData.allotted_account_id);
        const accSnap = await getDoc(accRef);
        if (accSnap.exists()) {
          const accData = accSnap.data();
          await updateDoc(accRef, {
            current_balance: (accData.current_balance || 0) + profit_loss
          });
        }
      }

      toast.success("IPO Application Logged!");
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to save application");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      await deleteDoc(doc(db, "ipo_applications", id));
      toast.success("Application deleted");
      loadData();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><LoadingSpinner className="w-8 h-8" /></div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">IPO Suite</h1>
          <p className="text-muted mt-2">Track upcoming IPOs and log your applications.</p>
        </div>
        <Button onClick={() => {
          setModalMode('UPCOMING');
          setFormData({
            ipo_name: "",
            symbol: "",
            application_date: new Date().toISOString().split('T')[0],
            application_number: "",
            status: "Pending",
            lots_applied: 1,
            total_amount: 15000,
            applied_account_id: "",
            allotted_account_id: "",
            lots_allotted: 0,
            is_sold: false,
            sell_date: new Date().toISOString().split('T')[0],
            sell_price: 0,
            offer_price: 0,
            lot_size: 1
          });
          setIsModalOpen(true);
        }} className="flex items-center gap-2">
          <i className="las la-plus"></i> Log Application
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: My Applications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <i className="las la-list-alt text-blue-500"></i> My Applications
            </h2>

            {myApplications.some(app => app.profit_loss !== undefined && app.profit_loss !== 0) && (
              <div className="flex items-center gap-2 bg-elevated border border-default px-4 py-2 rounded-xl">
                <span className="text-xs font-bold text-muted uppercase tracking-widest">Total Realized P&L:</span>
                <span className={`text-sm font-bold ${myApplications.reduce((acc, app) => acc + (app.profit_loss || 0), 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {myApplications.reduce((acc, app) => acc + (app.profit_loss || 0), 0) >= 0 ? '+' : ''}
                  ₹{myApplications.reduce((acc, app) => acc + (app.profit_loss || 0), 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {myApplications.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <i className="las la-rocket text-6xl text-muted mb-4 opacity-50"></i>
              <h3 className="text-lg font-bold text-primary">No Applications Logged</h3>
              <p className="text-muted mt-2">You haven't logged any IPO applications yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myApplications.map(app => (
                <Card key={app.id} className="p-5 flex flex-col justify-between hover:border-strong transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-primary text-lg">{app.ipo_name}</h3>
                        <p className="text-xs font-mono text-muted">{app.application_number || "No App #"}</p>
                      </div>
                      <Badge variant={app.status === "Allotted" ? "success" : app.status === "Rejected" ? "danger" : "warning"}>
                        {app.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Applied On</span>
                        <span className="text-primary font-medium">{new Date(app.application_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Lots</span>
                        <span className="text-primary font-medium">{app.lots_applied}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Investment</span>
                        <span className="text-primary font-mono">₹{app.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-default">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <i className="las la-trash"></i> Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: IPO Listings */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <i className="las la-rocket text-purple-500"></i> Market Overview
            </h2>

            <div className="flex flex-col gap-3">
              {/* Mainboard vs SME */}
              <div className="flex items-center justify-between p-1 bg-surface border border-default rounded-xl cursor-pointer w-full">
                <div
                  onClick={() => setIpoCategory('MAINBOARD')}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${ipoCategory === 'MAINBOARD' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' : 'text-muted hover:text-primary'}`}
                >
                  Mainboard
                </div>
                <div
                  onClick={() => setIpoCategory('SME')}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${ipoCategory === 'SME' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md' : 'text-muted hover:text-primary'}`}
                >
                  SME
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-4">
            {upcomingIpos
                .filter(ipo => ipoCategory === 'MAINBOARD' ? ipo.exchange !== 'SME' : ipo.exchange === 'SME')
                .map((ipo, idx) => (
                  <Link href={`/dashboard/ipos/${ipo.symbol}`} key={idx} className="block group">
                    <Card className="p-4 bg-elevated border border-default hover:border-blue-500/50 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0 border border-default">
                            {/* Placeholder Logo */}
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${ipo.name}&backgroundColor=000000&textColor=ffffff`} alt={ipo.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <h3 className="font-bold text-primary group-hover:text-blue-400 transition-colors text-lg leading-tight">{ipo.name}</h3>
                            <p className="text-xs text-muted mt-1 flex items-center gap-1">
                              <i className="las la-calendar"></i> Offer Date: {ipo.date === 'TBA' ? 'TBA' : new Date(ipo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {ipo.closeDate === 'TBA' ? 'TBA' : new Date(ipo.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="neutral" className={`text-[10px] whitespace-nowrap ${ipo.status === 'Live' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}`}>
                          {ipo.status === 'Live' ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {ipo.status}</span> : ipo.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-xs mb-4">
                        <div>
                          <p className="text-muted flex items-center gap-1"><i className="las la-tag"></i> Offer Price</p>
                          <p className="text-primary font-bold mt-0.5">{ipo.priceRange}</p>
                        </div>
                        <div>
                          <p className="text-muted flex items-center gap-1"><i className="las la-box"></i> Lot Size</p>
                          <p className="text-primary font-bold mt-0.5">{ipo.minLot}</p>
                        </div>
                        <div>
                          <p className="text-muted flex items-center gap-1"><i className="las la-users"></i> Subs</p>
                          <p className="text-primary font-bold mt-0.5">{ipo.subs}</p>
                        </div>

                        <div>
                          <p className="text-muted flex items-center gap-1"><i className="las la-chart-line"></i> Exp. Premium</p>
                          <p className={`font-bold mt-0.5 ${ipo.gmp && !ipo.gmp.startsWith('₹0') ? 'text-green-500' : 'text-red-500'}`}>
                            {ipo.gmp && !ipo.gmp.startsWith('₹0') ? <i className="las la-arrow-up text-[10px]"></i> : <i className="las la-arrow-down text-[10px]"></i>}
                            {ipo.gmp}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted flex items-center gap-1"><i className="las la-building"></i> Issue Size</p>
                          <p className="text-primary font-bold mt-0.5">{ipo.issueSize}</p>
                        </div>
                        <div>
                          <p className="text-muted flex items-center gap-1"><i className="las la-wallet"></i> Min. Amount</p>
                          <p className="text-primary font-bold mt-0.5">₹{ipo.minAmount?.toLocaleString()}/-</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full text-xs h-8 bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent navigating to detail page when clicking the button
                          setFormData({
                            ...formData,
                            ipo_name: ipo.name,
                            symbol: ipo.symbol,
                            application_date: new Date().toISOString().split('T')[0],
                            application_number: "",
                            status: "Pending",
                            lots_applied: 1,
                            total_amount: ipo.minAmount || 15000,
                            applied_account_id: "",
                            allotted_account_id: "",
                            lots_allotted: 0,
                            is_sold: false,
                            sell_date: new Date().toISOString().split('T')[0],
                            sell_price: 0,
                            offer_price: 0,
                            lot_size: 1
                          });
                          setModalMode('UPCOMING');
                          setIsModalOpen(true);
                        }}
                      >
                        Quick Log Application
                      </Button>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-0 md:left-72 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 relative shadow-2xl border border-default/20 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-primary"
            >
              <i className="las la-times text-xl"></i>
            </button>

            <h2 className="text-xl font-bold text-primary mb-6">Log IPO Application</h2>

            <form onSubmit={handleSaveApplication} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">IPO Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                  value={formData.ipo_name}
                  onChange={e => setFormData({ ...formData, ipo_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Application Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                    value={formData.application_date}
                    onChange={e => setFormData({ ...formData, application_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Status</label>
                  <select
                    className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Allotted">Allotted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Extended Fields for Listed/Past Applications */}
              {modalMode === 'LISTED' && (
                <div className="space-y-4 pt-2 border-t border-default/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Applied From Account</label>
                      <select
                        className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                        value={formData.applied_account_id}
                        onChange={e => setFormData({ ...formData, applied_account_id: e.target.value })}
                      >
                        <option value="">Select Account</option>
                        {userAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Allotted To Account</label>
                      <select
                        className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                        value={formData.allotted_account_id}
                        onChange={e => setFormData({ ...formData, allotted_account_id: e.target.value })}
                        disabled={formData.status !== 'Allotted'}
                      >
                        <option value="">Select Account</option>
                        {userAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Lots Applied</label>
                      <input
                        type="number"
                        required min="1"
                        className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                        value={formData.lots_applied}
                        onChange={e => setFormData({ ...formData, lots_applied: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Lots Allotted</label>
                      <input
                        type="number"
                        required min="0"
                        disabled={formData.status !== 'Allotted'}
                        className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={formData.lots_allotted}
                        onChange={e => setFormData({ ...formData, lots_allotted: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {formData.status === 'Allotted' && (
                    <div className="bg-surface/50 p-3 rounded-lg border border-default">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          id="is_sold"
                          className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-default"
                          checked={formData.is_sold}
                          onChange={e => setFormData({ ...formData, is_sold: e.target.checked })}
                        />
                        <label htmlFor="is_sold" className="text-sm font-bold text-primary">I have sold this IPO</label>
                      </div>

                      {formData.is_sold && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Lot Size (Shares)</label>
                            <input
                              type="number"
                              className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                              value={formData.lot_size}
                              onChange={e => setFormData({ ...formData, lot_size: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Offer Price (₹)</label>
                            <input
                              type="number"
                              className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                              value={formData.offer_price}
                              onChange={e => setFormData({ ...formData, offer_price: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Sell Price (₹)</label>
                            <input
                              type="number"
                              className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                              value={formData.sell_price}
                              onChange={e => setFormData({ ...formData, sell_price: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Sell Date</label>
                            <input
                              type="date"
                              className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                              value={formData.sell_date}
                              onChange={e => setFormData({ ...formData, sell_date: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Standard fields for Upcoming mode */}
              {modalMode === 'UPCOMING' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Lots</label>
                    <input
                      type="number"
                      required min="1"
                      className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                      value={formData.lots_applied}
                      onChange={e => setFormData({ ...formData, lots_applied: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Total Amount (₹)</label>
                    <input
                      type="number"
                      required min="0"
                      className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                      value={formData.total_amount}
                      onChange={e => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Application Number (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-elevated border border-default rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-blue-500"
                  value={formData.application_number}
                  onChange={e => setFormData({ ...formData, application_number: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full mt-4">
                {modalMode === 'LISTED' ? 'Log Trade Details' : 'Save Application'}
              </Button>
            </form>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
