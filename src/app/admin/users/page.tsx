"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-users text-3xl text-blue-500"></i>
            User Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">View, edit, or delete registered users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-yellow-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
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
                  <tr key={u.uid} className="hover:bg-gray-100 dark:hover:bg-[#16181d] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e5e7eb] dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-gray-500 dark:text-slate-400">{u.email?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{u.name || "Unknown"}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        u.role === "admin" 
                          ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" 
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      {u.created_at?.seconds 
                        ? new Date(u.created_at.seconds * 1000).toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
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
