"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [filter, setFilter] = useState<"All" | "Active" | "Expiring Soon" | "Expired">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserDoc | null>(null);
  
  // Access Modal States
  const [selectedTier, setSelectedTier] = useState<"FREE" | "STARTER" | "PRO" | "ELITE">("FREE");
  const [selectedDuration, setSelectedDuration] = useState<"1_MONTH" | "3_MONTHS" | "1_YEAR" | "LIFETIME" | "CUSTOM">("1_MONTH");
  const [customExpiry, setCustomExpiry] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const uSnap = await getDocs(query(collection(db, "users")));
      const dbUsers: UserDoc[] = [];
      uSnap.docs.forEach(d => {
        dbUsers.push({ ...d.data(), id: d.id } as UserDoc);
      });
      setUsers(dbUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (user: UserDoc) => {
    if (user.subscription_tier === "free") return "FREE";
    if (!user.plan_expires_at) return "LIFETIME";
    
    const expiry = new Date(user.plan_expires_at);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return "EXPIRED";
    if (diffDays <= 7) return "EXPIRING_SOON";
    return "ACTIVE";
  };

  const openManageModal = (user: UserDoc) => {
    setCurrentUser(user);
    setSelectedTier(user.subscription_tier?.toUpperCase() as any || "FREE");
    if (user.plan_expires_at) {
      setCustomExpiry(new Date(user.plan_expires_at).toISOString().split('T')[0]);
    } else {
      setCustomExpiry(new Date().toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

  const calculateExpiry = (duration: string) => {
    if (duration === "LIFETIME") return null;
    const now = new Date();
    if (duration === "1_MONTH") now.setMonth(now.getMonth() + 1);
    if (duration === "3_MONTHS") now.setMonth(now.getMonth() + 3);
    if (duration === "1_YEAR") now.setFullYear(now.getFullYear() + 1);
    return now.toISOString();
  };

  const handleUpdateAccess = async () => {
    if (!currentUser) return;
    
    let newExpiry: string | null = null;
    if (selectedTier !== "FREE") {
      if (selectedDuration === "CUSTOM") {
        if (!customExpiry) {
          toast.error("Please select a custom expiration date.");
          return;
        }
        newExpiry = new Date(customExpiry).toISOString();
      } else {
        newExpiry = calculateExpiry(selectedDuration);
      }
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", currentUser.id!), {
        subscription_tier: selectedTier.toLowerCase(),
        plan_expires_at: newExpiry
      });
      
      toast.success("User access updated successfully");
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error("Failed to update access: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics Calculation
  const activeSubs = users.filter(u => getStatus(u) === "ACTIVE" || getStatus(u) === "LIFETIME").length;
  const expiringSoon = users.filter(u => getStatus(u) === "EXPIRING_SOON").length;
  const expiredSubs = users.filter(u => getStatus(u) === "EXPIRED").length;

  // Filtering
  const filteredUsers = users.filter(u => {
    const status = getStatus(u);
    const matchesSearch = (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    if (!matchesSearch) return false;
    
    if (filter === "All") return true;
    if (filter === "Active") return status === "ACTIVE" || status === "LIFETIME";
    if (filter === "Expiring Soon") return status === "EXPIRING_SOON";
    if (filter === "Expired") return status === "EXPIRED";
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Global Subscriptions</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Monitor user plan lifecycles, manage access tiers, and track expirations.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Active Subscriptions</div>
          <div className="text-3xl font-bold text-white">{activeSubs}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Expiring Soon (≤ 7 Days)</div>
          <div className="text-3xl font-bold text-white">{expiringSoon}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Expired Accounts</div>
          <div className="text-3xl font-bold text-white">{expiredSubs}</div>
        </div>
      </div>

      {/* The Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="bg-[#121212] border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Subscription Directory</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium bg-black border-neutral-800 text-sm"
            />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-premium bg-black border-neutral-800 text-sm font-bold text-neutral-400"
            >
              <option value="All">All Users</option>
              <option value="Active">Active Plans</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#1a1a1a] text-neutral-500 text-[10px] font-bold uppercase tracking-widest border-b border-neutral-800">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <LoadingSpinner className="w-8 h-8 mx-auto border-blue-500" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 font-bold">
                    No subscriptions match your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const status = getStatus(user);
                  return (
                    <tr key={user.id} className="hover:bg-[#121212]/50 transition-colors border-b border-neutral-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700">
                            {user.photo_url ? (
                              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <i className="las la-user text-neutral-500"></i>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-bold">{user.name || "Unknown"}</div>
                            <div className="text-xs text-neutral-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.subscription_tier === "free" && <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Free</span>}
                        {user.subscription_tier === "starter" && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Starter</span>}
                        {user.subscription_tier === "pro" && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Pro</span>}
                        {user.subscription_tier === "elite" && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">Elite</span>}
                      </td>
                      <td className="px-6 py-4">
                        {status === "FREE" && <span className="text-neutral-500 font-bold text-xs">—</span>}
                        {status === "LIFETIME" && <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1"><i className="las la-infinity"></i> Lifetime</span>}
                        {status === "ACTIVE" && <span className="text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1"><i className="las la-check-circle"></i> Active</span>}
                        {status === "EXPIRING_SOON" && <span className="text-amber-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1"><i className="las la-clock"></i> Expiring Soon</span>}
                        {status === "EXPIRED" && <span className="text-rose-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1"><i className="las la-times-circle"></i> Expired</span>}
                      </td>
                      <td className="px-6 py-4">
                        {(status === "FREE" || status === "LIFETIME") ? (
                          <span className="text-neutral-600 font-mono text-xs">—</span>
                        ) : (
                          <span className={`font-mono text-xs font-bold ${status === 'EXPIRED' ? 'text-rose-400' : 'text-neutral-300'}`}>
                            {user.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openManageModal(user)}
                          className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center ml-auto"
                          title="Manage Access"
                        >
                          <i className="las la-cog text-xl"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Access Modal */}
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative border border-neutral-800">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <i className="las la-times text-2xl"></i>
            </button>
            
            <h2 className="text-xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
              <i className="las la-key text-blue-500"></i> Manage Access
            </h2>
            <p className="text-xs text-neutral-400 mb-6">Modify the plan tier and expiration logic for <strong>{currentUser.email}</strong>.</p>
            
            <div className="space-y-6 mb-8">
              {/* Step 1: Tier Selection */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-3">Step 1: Select Tier</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["FREE", "STARTER", "PRO", "ELITE"] as const).map(tier => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                        selectedTier === tier 
                          ? tier === "FREE" ? "bg-neutral-800 text-white border-neutral-600" 
                          : tier === "STARTER" ? "bg-blue-500/20 text-blue-400 border-blue-500" 
                          : tier === "PRO" ? "bg-purple-500/20 text-purple-400 border-purple-500" 
                          : "bg-amber-500/20 text-amber-400 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                          : "bg-[#121212] text-neutral-500 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Duration (Only if not free) */}
              {selectedTier !== "FREE" && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-3">Step 2: Add Duration</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                    {(["1_MONTH", "3_MONTHS", "1_YEAR", "LIFETIME", "CUSTOM"] as const).map(dur => (
                      <button
                        key={dur}
                        onClick={() => setSelectedDuration(dur)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                          selectedDuration === dur 
                            ? "bg-white/10 text-white border-white/20" 
                            : "bg-[#121212] text-neutral-500 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        {dur.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  {selectedDuration === "CUSTOM" && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Custom Expiration Date</label>
                      <input 
                        type="date" 
                        value={customExpiry}
                        onChange={e => setCustomExpiry(e.target.value)}
                        className="input-premium w-full bg-[#121212] border-neutral-800 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
              <button onClick={handleUpdateAccess} className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner className="w-4 h-4" /> : <i className="las la-check"></i>} Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
