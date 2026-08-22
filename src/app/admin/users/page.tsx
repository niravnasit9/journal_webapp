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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, uid: string, email: string}>({isOpen: false, uid: "", email: ""});

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

  const handleUpdateTier = async (uid: string, newTier: string) => {
    setOpenDropdownId(null);
    setUpdatingId(uid);
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        subscription_tier: newTier === "free" ? null : newTier,
        subscription_status: newTier === "free" ? null : "active"
      });
      toast.success("Subscription updated!");
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, subscription_tier: newTier === "free" ? undefined : newTier as any } : u));
    } catch (error) {
      console.error("Failed to update tier", error);
      toast.error("Failed to update user tier");
    } finally {
      setUpdatingId(null);
    }
  };

  const getPlanVariant = (tier: string | undefined | null) => {
    switch (tier) {
      case "elite": return "elite";
      case "pro": return "pro";
      case "starter": return "starter";
      default: return "free";
    }
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

      <Card className="overflow-visible border-default">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm text-secondary">
            <thead className="bg-surface text-xs font-bold text-muted uppercase tracking-widest border-b border-subtle">
              <tr>
                <th className="px-4 md:px-6 py-4">User</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Plan & Limits</th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Role</th>
                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Created</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center"><LoadingSpinner /></td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted font-bold">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className={`hover:bg-elevated transition-colors relative ${openDropdownId === u.uid ? 'z-50' : 'z-0'}`}>
                    <td className="px-4 md:px-6 py-4 relative">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0 border border-default hidden sm:flex">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <i className="las la-user text-muted"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-primary line-clamp-1">{u.name || "Unknown Trader"}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 md:px-6 py-4 hidden md:table-cell ${openDropdownId === u.uid ? 'relative z-50' : ''}`}>
                      <div className="flex flex-col gap-2">
                        <div className="relative group w-36">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === u.uid ? null : u.uid)}
                            disabled={updatingId === u.uid}
                            className={`w-full text-left rounded-lg border px-3 py-2 pr-8 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center justify-between
                              ${u.subscription_tier === 'elite' ? 'bg-[var(--plan-elite-bg)] text-[var(--plan-elite)] border-[var(--plan-elite)]/30' : 
                                u.subscription_tier === 'pro' ? 'bg-[var(--plan-pro-bg)] text-[var(--plan-pro)] border-[var(--plan-pro)]/30' :
                                u.subscription_tier === 'starter' ? 'bg-[var(--plan-starter-bg)] text-[var(--plan-starter)] border-[var(--plan-starter)]/30' :
                                'bg-elevated text-secondary border-default hover:bg-surface'
                              }
                            `}
                          >
                            <span>{u.subscription_tier || "free"}</span>
                            <div className={`absolute inset-y-0 right-3 flex items-center pointer-events-none transition-transform ${openDropdownId === u.uid ? 'rotate-180' : ''} ${updatingId === u.uid ? 'opacity-0' : 'opacity-100'}`}>
                              <i className="las la-angle-down text-sm"></i>
                            </div>
                            {updatingId === u.uid && (
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <LoadingSpinner className="w-3 h-3 border-[2px]" />
                              </div>
                            )}
                          </button>
                          
                          {openDropdownId === u.uid && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setOpenDropdownId(null)} 
                              />
                              <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-subtle rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-3 pb-2 mb-2 border-b border-subtle text-[10px] font-bold text-muted uppercase tracking-widest">
                                  Select Plan
                                </div>
                                <button 
                                  onClick={() => handleUpdateTier(u.uid, "free")}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-secondary hover:bg-elevated transition-colors flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-muted"></span> FREE
                                </button>
                                <button 
                                  onClick={() => handleUpdateTier(u.uid, "starter")}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-[var(--plan-starter)] hover:bg-[var(--plan-starter-bg)] transition-colors flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-[var(--plan-starter)]"></span> STARTER
                                </button>
                                <button 
                                  onClick={() => handleUpdateTier(u.uid, "pro")}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-[var(--plan-pro)] hover:bg-[var(--plan-pro-bg)] transition-colors flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-[var(--plan-pro)]"></span> PRO
                                </button>
                                <button 
                                  onClick={() => handleUpdateTier(u.uid, "elite")}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-[var(--plan-elite)] hover:bg-[var(--plan-elite-bg)] transition-colors flex items-center gap-2 group relative"
                                >
                                  <span className="w-2 h-2 rounded-full bg-[var(--plan-elite)] animate-pulse shrink-0"></span> 
                                  ELITE
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-muted font-medium">
                          {!u.subscription_tier || u.subscription_tier === "free" ? "Max 3 Strategies" : "Unlimited Strategies"}
                          {u.subscription_tier === "pro" ? " • Backtesting" : ""}
                          {u.subscription_tier === "elite" ? " • Backtesting • AI" : ""}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      <Badge variant={u.role === 'admin' ? 'info' : 'neutral'} size="sm" className="uppercase">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <span className="font-bold text-primary">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/admin/users/${u.uid}`}
                          className="w-8 h-8 rounded-lg text-muted hover:text-info hover:bg-info-bg flex items-center justify-center transition-colors"
                          title="Manage User"
                        >
                          <i className="las la-pen text-lg"></i>
                        </Link>
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
