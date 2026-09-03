"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, deleteDoc, doc, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Modal States
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, uid: string, email: string}>({isOpen: false, uid: "", email: ""});
  const [manageAccessUser, setManageAccessUser] = useState<UserDoc | null>(null);
  
  // Manage Access Form States
  const [selectedTier, setSelectedTier] = useState<string>("free");
  const [selectedDuration, setSelectedDuration] = useState<string>("30");
  const [customDays, setCustomDays] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const userList = snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserDoc));
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = (uid: string, email: string) => {
    setConfirmModal({ isOpen: true, uid, email });
  };

  const handleDeleteUser = async () => {
    const { uid, email } = confirmModal;
    setConfirmModal({ isOpen: false, uid: "", email: "" });

    try {
      const accountsQuery = query(collection(db, "accounts"), where("owner_uid", "==", uid));
      const accountsSnap = await getDocs(accountsQuery);
      
      for (const acc of accountsSnap.docs) {
        const tradesQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tradesSnap = await getDocs(tradesQuery);
        for (const t of tradesSnap.docs) {
          await deleteDoc(doc(db, "trades", t.id));
        }
        await deleteDoc(doc(db, "accounts", acc.id));
      }

      await deleteDoc(doc(db, "users", uid));

      toast.success(`Successfully wiped all data for ${email}`);
      fetchUsers(); 
    } catch (error: any) {
      console.error("Wipe failed", error);
      toast.error("Failed to wipe data: " + error.message);
    }
  };

  const openManageAccess = (user: UserDoc) => {
    setManageAccessUser(user);
    setSelectedTier(user.subscription_tier || "free");
    setSelectedDuration("30");
    setCustomDays("");
  };

  const closeManageAccess = () => {
    setManageAccessUser(null);
  };

  const executeTierUpdate = async () => {
    if (!manageAccessUser) return;
    const uid = manageAccessUser.uid;
    setUpdatingId(uid);
    
    try {
      const userRef = doc(db, "users", uid);
      const updates: any = {
        subscription_tier: selectedTier === "free" ? null : selectedTier,
        subscription_status: selectedTier === "free" ? null : "active"
      };

      if (selectedTier !== "free") {
        const now = new Date();
        updates.plan_started_at = now.toISOString();
        
        if (selectedDuration === "lifetime") {
          const lifetimeDate = new Date();
          lifetimeDate.setFullYear(now.getFullYear() + 100);
          updates.plan_expires_at = lifetimeDate.toISOString();
          updates.plan_duration_days = 36500;
        } else {
          let days = parseInt(selectedDuration);
          if (selectedDuration === "custom") {
            days = parseInt(customDays);
            if (isNaN(days) || days <= 0) {
              toast.error("Please enter a valid number of days.");
              setUpdatingId(null);
              return;
            }
          }
          updates.plan_duration_days = days;
          const expiryDate = new Date();
          expiryDate.setDate(now.getDate() + days);
          updates.plan_expires_at = expiryDate.toISOString();
        }
      } else {
        updates.plan_started_at = null;
        updates.plan_expires_at = null;
        updates.plan_duration_days = null;
      }

      await updateDoc(userRef, updates);
      toast.success("Subscription updated successfully!");
      setUsers(prev => prev.map(u => u.uid === uid ? { 
        ...u, 
        subscription_tier: selectedTier === "free" ? undefined : selectedTier as any,
        ...updates
      } : u));
      closeManageAccess();
    } catch (error) {
      console.error("Failed to update tier", error);
      toast.error("Failed to update user tier");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatFirebaseDate = (dateVal: any) => {
    if (!dateVal) return "Unknown";
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString();
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? "Invalid Date" : parsed.toLocaleDateString();
  };

  const renderPlanBadge = (tier: string | undefined) => {
    switch (tier) {
      case 'elite':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Elite</span>;
      case 'pro':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Pro</span>;
      case 'starter':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Starter</span>;
      default:
        return <span className="bg-neutral-800 text-neutral-300 border border-strong px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Free</span>;
    }
  };

  const renderExpiry = (user: UserDoc) => {
    if (!user.subscription_tier || user.subscription_tier === 'free') return <span className="text-secondary">-</span>;
    if (!user.plan_expires_at) return <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Lifetime</span>;
    
    const expiresAt = new Date(user.plan_expires_at).getTime();
    const now = new Date().getTime();
    if (expiresAt > now + 10 * 365 * 24 * 60 * 60 * 1000) {
      return <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest"><i className="las la-infinity text-sm"></i> Lifetime</span>;
    }
    
    return <span className="text-neutral-300">{new Date(user.plan_expires_at).toLocaleDateString()}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface p-8 md:p-10 rounded-2xl border border-subtle relative overflow-hidden">
        <div className="relative z-10">
          <Badge variant="info" size="sm" className="mb-4">
            <i className="las la-shield-alt mr-1"></i> Admin Control
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight flex items-center gap-3 mb-2">
            <i className="las la-users text-info"></i>
            User Management
          </h1>
          <p className="text-secondary font-medium">View, edit, or delete registered users.</p>
        </div>
      </div>

      <Card className="overflow-visible border-default p-0">
        <div className="max-md:overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm text-secondary">
            <thead className="bg-surface text-xs font-bold text-muted uppercase tracking-widest border-b border-subtle">
              <tr>
                <th className="px-4 md:px-6 py-4">User</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Plan Tier</th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Role</th>
                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Created</th>
                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Expiry</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center"><LoadingSpinner /></td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#121212]/50 transition-colors border-b border-default">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0 border border-default hidden sm:flex">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <i className="las la-user text-muted"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white line-clamp-1">{u.name || "Unknown Trader"}</p>
                          <p className="text-sm text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      {renderPlanBadge(u.subscription_tier)}
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      <Badge variant={u.role === 'admin' ? 'info' : 'neutral'} size="sm" className="uppercase">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <span className="text-neutral-300">
                        {formatFirebaseDate(u.created_at)}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      {renderExpiry(u)}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openManageAccess(u)}
                          className="btn-ghost flex items-center gap-2 text-xs py-1.5 px-3"
                        >
                          <i className="las la-cog text-lg"></i> Manage Access
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDeleteUser(u.uid, u.email); }}
                          className="w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-danger-bg flex items-center justify-center transition-colors"
                          title="Wipe Data"
                        >
                          <i className="las la-trash-alt text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MANAGE ACCESS MODAL */}
      {manageAccessUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Manage Access</h2>
                <p className="text-sm text-secondary mt-1">For <span className="font-bold text-white">{manageAccessUser.name || manageAccessUser.email}</span></p>
              </div>
              <button onClick={closeManageAccess} className="text-muted hover:text-white transition-colors">
                <i className="las la-times text-2xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Plan Selection */}
              <div>
                <label className="label-premium mb-3 block">1. Select Plan Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'free', label: 'Free' },
                    { id: 'starter', label: 'Starter' },
                    { id: 'pro', label: 'Pro' },
                    { id: 'elite', label: 'Elite' },
                  ].map(plan => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedTier(plan.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedTier === plan.id 
                          ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                          : 'border-default bg-[#121212] hover:bg-neutral-800/50'
                      }`}
                    >
                      <span className={`text-sm font-bold uppercase tracking-widest ${selectedTier === plan.id ? 'text-blue-400' : 'text-secondary'}`}>
                        {plan.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Duration Selection (Conditional) */}
              {selectedTier !== "free" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="label-premium mb-3 block">2. Select Duration</label>
                  <select 
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="input-premium w-full mb-3"
                  >
                    <option value="30">1 Month (30 Days)</option>
                    <option value="90">3 Months (90 Days)</option>
                    <option value="180">6 Months (180 Days)</option>
                    <option value="365">1 Year (365 Days)</option>
                    <option value="lifetime">Lifetime Access</option>
                    <option value="custom">Custom Days...</option>
                  </select>

                  {selectedDuration === "custom" && (
                    <div className="animate-in fade-in zoom-in-95">
                      <input 
                        type="number"
                        placeholder="Enter number of days"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className="input-premium w-full"
                        min="1"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-default">
              <button 
                onClick={closeManageAccess}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={executeTierUpdate}
                disabled={updatingId === manageAccessUser.uid}
                className="btn-primary flex items-center gap-2"
              >
                {updatingId === manageAccessUser.uid ? <LoadingSpinner className="w-4 h-4 border-[2px]" /> : <i className="las la-check"></i>}
                Confirm & Update
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete User Data"
        message={`DANGER: Are you sure you want to permanently delete all Firestore data for ${confirmModal.email}? This will wipe their user doc, accounts, and trades. Their Firebase Auth login will remain but they will have no data.`}
        confirmText="Delete User Data"
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmModal({ isOpen: false, uid: "", email: "" })}
        isDanger={true}
      />
    </div>
  );
}
