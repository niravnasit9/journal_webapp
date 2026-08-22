"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, deleteDoc, doc, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
      // 1. Delete all trades
      const accountsQuery = query(collection(db, "accounts"), where("owner_uid", "==", uid));
      const accountsSnap = await getDocs(accountsQuery);
      
      for (const acc of accountsSnap.docs) {
        const tradesQuery = query(collection(db, "trades"), where("account_id", "==", acc.id));
        const tradesSnap = await getDocs(tradesQuery);
        for (const t of tradesSnap.docs) {
          await deleteDoc(doc(db, "trades", t.id));
        }
        // 2. Delete the account itself
        await deleteDoc(doc(db, "accounts", acc.id));
      }

      // 3. Delete the user doc
      await deleteDoc(doc(db, "users", uid));

      toast.success(`Successfully wiped all data for ${email}`);
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error("Wipe failed", error);
      toast.error("Failed to wipe data: " + error.message);
    }
  };

  const getPlanTheme = (tier: string | undefined | null) => {
    switch (tier) {
      case "elite": return "bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-[#523e6b] text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 animate-gradient-x focus:ring-purple-500/50";
      case "pro": return "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-500 focus:ring-yellow-500/50";
      case "starter": return "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 focus:ring-blue-500/50";
      default: return "bg-gray-50 dark:bg-[#1a1d24] border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 focus:ring-indigo-500/50";
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-[#111] p-8 md:p-10 rounded-[2rem] shadow-[0_0_30px_rgba(168,85,247,0.05)] border border-purple-100 dark:border-[#523e6b] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest mb-4">
            <i className="las la-shield-alt"></i> Admin Control
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3 mb-2">
            <i className="las la-users text-purple-500"></i>
            User Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">View, edit, or delete registered users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-white/5 rounded-3xl shadow-xl overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-4 md:px-6 py-4">User</th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell">Plan & Limits</th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Role</th>
                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">Created</th>
                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8"><LoadingSpinner /></td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 font-bold">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className={`hover:bg-gray-100 dark:hover:bg-[#16181d] transition-colors relative ${openDropdownId === u.uid ? 'z-50' : 'z-0'}`}>
                    <td className="px-4 md:px-6 py-4 relative">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10 hidden sm:flex">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <i className="las la-user text-gray-400"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{u.name || "Unknown Trader"}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 md:px-6 py-4 hidden md:table-cell ${openDropdownId === u.uid ? 'relative z-50' : ''}`}>
                      <div className="flex flex-col gap-2">
                        <div className="relative group w-36">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === u.uid ? null : u.uid)}
                            disabled={updatingId === u.uid}
                            className={`w-full text-left rounded-xl border px-3 py-2 pr-8 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center justify-between ${getPlanTheme(u.subscription_tier)}`}
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
                          
                          {/* Custom Dropdown Menu */}
                          {openDropdownId === u.uid && (
                            <>
                              {/* Invisible overlay for click-outside */}
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setOpenDropdownId(null)} 
                              />
                              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#111318] border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                              <div className="px-3 pb-2 mb-2 border-b border-gray-100 dark:border-slate-800 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                Select Plan
                              </div>
                              <button 
                                onClick={() => handleUpdateTier(u.uid, "free")}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span> FREE
                              </button>
                              <button 
                                onClick={() => handleUpdateTier(u.uid, "starter")}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> STARTER
                              </button>
                              <button 
                                onClick={() => handleUpdateTier(u.uid, "pro")}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 transition-colors flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span> PRO
                              </button>
                              <button 
                                onClick={() => handleUpdateTier(u.uid, "elite")}
                                className="w-full text-left px-4 py-2.5 text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-2 group relative"
                              >
                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse shrink-0"></span> 
                                ELITE
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              </button>
                            </div>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                          {!u.subscription_tier || u.subscription_tier === "free" ? "Max 3 Strategies" : "Unlimited Strategies"}
                          {u.subscription_tier === "pro" ? " • Backtesting" : ""}
                          {u.subscription_tier === "elite" ? " • Backtesting • AI" : ""}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        u.role === 'admin' 
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20' 
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-white/10'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/users/${u.uid}`}
                          className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-gray-900 dark:text-white flex items-center justify-center transition-colors"
                          title="Manage User"
                        >
                          <i className="las la-pen"></i>
                        </Link>
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDeleteUser(u.uid, u.email); }}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-gray-900 dark:text-white flex items-center justify-center transition-colors"
                          title="Wipe Data"
                        >
                          <i className="las la-trash-alt"></i>
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
