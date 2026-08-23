"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc, AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import { updatePassword, updateEmail } from "firebase/auth";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminUserDetailPage() {
  const { id: uid } = useParams() as { id: string };
  const router = useRouter();

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, accountId: string}>({isOpen: false, accountId: ""});

  const [activeTab, setActiveTab] = useState<"Profile" | "Subscription" | "Accounts" | "Trades" | "Transactions">("Profile");

  // Edit User State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ label: "", broker: "", account_type: "", currency: "USD" });
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    if (uid) {
      fetchUserData();
      fetchAccountTypes();
    }
  }, [uid]);

  const fetchAccountTypes = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "platform"));
      if (snap.exists() && snap.data().accountTypes) {
        setAvailableTypes(snap.data().accountTypes);
      } else {
        setAvailableTypes(["Funded", "Real"]);
      }
    } catch (e) {
      setAvailableTypes(["Funded", "Real"]);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Fetch User Doc
      const uSnap = await getDoc(doc(db, "users", uid));
      if (uSnap.exists()) {
        setUserDoc({ ...uSnap.data(), uid: uSnap.id } as UserDoc);
      } else {
        toast.error("User not found");
        router.push("/admin/users");
        return;
      }

      // Fetch User's Accounts
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", uid));
      const accSnap = await getDocs(accQuery);
      setAccounts(accSnap.docs.map(d => ({ ...d.data(), id: d.id } as AccountDoc)));
    } catch (error) {
      console.error("Error fetching user data", error);
      toast.error("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (newRole: "admin" | "user") => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      setUserDoc(prev => prev ? { ...prev, role: newRole } : null);
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleUpdateName = async () => {
    if (!editNameValue.trim()) return;
    try {
      await updateDoc(doc(db, "users", uid), { name: editNameValue.trim() });
      setUserDoc(prev => prev ? { ...prev, name: editNameValue.trim() } : null);
      toast.success("User name updated successfully");
      setIsEditingName(false);
    } catch (error) {
      toast.error("Failed to update user name");
    }
  };

  const handleUpdateAccount = async (accountId: string) => {
    try {
      await updateDoc(doc(db, "accounts", accountId), editFormData);
      toast.success("Account updated");
      setEditingAccountId(null);
      fetchUserData(); // refresh list
    } catch (error) {
      toast.error("Failed to update account");
    }
  };

  const confirmDeleteAccount = (accountId: string) => {
    setConfirmModal({ isOpen: true, accountId });
  };

  const handleDeleteAccount = async () => {
    const accountId = confirmModal.accountId;
    setConfirmModal({ isOpen: false, accountId: "" });
    
    try {
      // 1. Delete all trades for this account
      const tQuery = query(collection(db, "trades"), where("account_id", "==", accountId));
      const tSnap = await getDocs(tQuery);
      for (const t of tSnap.docs) {
        await deleteDoc(doc(db, "trades", t.id));
      }
      
      // 2. Delete the account
      await deleteDoc(doc(db, "accounts", accountId));
      toast.success("Account deleted");
      fetchUserData();
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1c]"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  if (!userDoc) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans max-w-6xl">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/users" className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f2229] hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors flex items-center justify-center">
          <i className="las la-arrow-left text-xl"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <i className="las la-user-cog text-3xl text-purple-500"></i>
            Manage User
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">Viewing details for {userDoc.email}</p>
        </div>
      </div>

      <div className="flex border-b border-subtle mb-6 overflow-x-auto no-scrollbar">
        {["Profile", "Subscription", "Accounts", "Trades", "Transactions"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-bold text-sm tracking-widest uppercase transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab 
                ? "border-info text-info bg-info/5" 
                : "border-transparent text-secondary hover:text-primary hover:border-subtle"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* User Profile Tab */}
        {activeTab === "Profile" && (
          <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-yellow-200 dark:border-slate-800 shadow-xl self-start space-y-6 max-w-2xl">
          <div className="flex items-center gap-4 border-b border-yellow-200 dark:border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-yellow-300 dark:border-slate-700">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{userDoc.email.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    className="bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-lg px-2 py-1 text-gray-900 dark:text-white text-sm w-full focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <button onClick={handleUpdateName} className="text-emerald-400 hover:text-emerald-300">
                    <i className="las la-check-circle text-xl"></i>
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:text-slate-400">
                    <i className="las la-times-circle text-xl"></i>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{userDoc.name || "No Name Set"}</h2>
                  <button 
                    onClick={() => {
                      setEditNameValue(userDoc.name || "");
                      setIsEditingName(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-opacity"
                  >
                    <i className="las la-pen text-sm"></i>
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-slate-400">{userDoc.email}</p>
              <div className="mt-2">
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border ${userDoc.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                  {userDoc.role}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Change Role</label>
            <CustomSelect 
              options={[
                { value: "user", label: "Standard User" },
                { value: "admin", label: "Administrator" }
              ]}
              value={userDoc.role}
              onChange={(val) => handleUpdateRole(val as "admin" | "user")}
            />
          </div>
          
          <div>
             <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">User UID</label>
             <code className="block bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-xs p-3 rounded-lg break-all">
               {userDoc.uid}
             </code>
          </div>
         </div>
        )}

        {/* Other Tabs placeholders */}
        {activeTab === "Subscription" && (
          <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center">
            <i className="las la-crown text-4xl mb-2"></i>
            <p className="font-bold">Subscription Info</p>
            <p className="text-sm">Tier: {userDoc.subscription_tier || (userDoc as any).tier || "Free"}</p>
          </div>
        )}

        {activeTab === "Trades" && (
          <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center">
            <i className="las la-chart-bar text-4xl mb-2"></i>
            <p className="font-bold">User Trades</p>
            <p className="text-sm">Trade history will be rendered here.</p>
          </div>
        )}

        {activeTab === "Transactions" && (
          <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center">
            <i className="las la-receipt text-4xl mb-2"></i>
            <p className="font-bold">Transaction History</p>
            <p className="text-sm">Invoices and payments will be rendered here.</p>
          </div>
        )}

        {/* User's Accounts List */}
        {activeTab === "Accounts" && (
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <i className="las la-wallet text-2xl text-blue-500"></i>
            User's Trading Accounts
          </h2>
          
          {accounts.length === 0 ? (
            <div className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center">
              <i className="las la-wallet text-4xl mb-2"></i>
              <p className="font-bold">No accounts found.</p>
              <p className="text-sm">This user hasn't created any trading accounts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white dark:bg-[#111318] border border-yellow-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
                  {editingAccountId === acc.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-slate-500 font-bold mb-1">Account Label</label>
                          <input 
                            value={editFormData.label}
                            onChange={e => setEditFormData({...editFormData, label: e.target.value})}
                            className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-slate-500 font-bold mb-1">Broker</label>
                          <input 
                            value={editFormData.broker}
                            onChange={e => setEditFormData({...editFormData, broker: e.target.value})}
                            className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-300 dark:border-slate-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-slate-500 font-bold mb-1">Type</label>
                          <CustomSelect 
                            options={availableTypes.map(type => ({ value: type, label: type }))}
                            value={editFormData.account_type}
                            onChange={val => setEditFormData({...editFormData, account_type: val})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 dark:text-slate-500 font-bold mb-1">Currency</label>
                          <CustomSelect 
                            options={[
                              { value: "USD", label: "USD" },
                              { value: "INR", label: "INR" }
                            ]}
                            value={editFormData.currency}
                            onChange={val => setEditFormData({...editFormData, currency: val as "USD" | "INR"})}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingAccountId(null)} className="px-4 py-2 bg-[#e5e7eb] dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm font-bold">Cancel</button>
                        <button onClick={() => handleUpdateAccount(acc.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white rounded-lg text-sm font-bold">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {acc.label}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                            acc.account_type === 'real' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {acc.account_type}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Broker: {acc.broker} • Currency: {acc.currency}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditFormData({
                              label: acc.label,
                              broker: acc.broker,
                              account_type: acc.account_type,
                              currency: acc.currency || "USD"
                            });
                            setEditingAccountId(acc.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-[#1f2229] hover:bg-slate-700 text-gray-700 dark:text-slate-300 flex items-center justify-center transition-colors"
                          title="Edit Account"
                        >
                          <i className="las la-pen"></i>
                        </button>
                        <button 
                          onClick={() => confirmDeleteAccount(acc.id)}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-gray-900 dark:text-white flex items-center justify-center transition-colors"
                          title="Delete Account & Trades"
                        >
                          <i className="las la-trash"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Account"
        message="WARNING: This will permanently delete the account AND all of its trades. This action cannot be undone. Are you sure?"
        confirmText="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmModal({ isOpen: false, accountId: "" })}
        isDanger={true}
      />
    </div>
  );
}
