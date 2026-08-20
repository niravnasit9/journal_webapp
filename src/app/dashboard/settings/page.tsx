"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { auth, db } from "@/lib/firebase/config";
import { updatePassword } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Profile State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isWiping, setIsWiping] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || "");
            setPhone(data.phone || "");
            setCountry(data.country || "");
          }
        } catch (e) {
          console.error("Failed to fetch profile", e);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    try {
      setIsUpdatingProfile(true);
      await updateDoc(doc(db, "users", user.uid), { 
        name: name.trim(),
        phone: phone.trim(),
        country: country.trim()
      });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password. You may need to log in again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAllTrades = async () => {
    if (!user) return;
    
    try {
      setIsWiping(true);
      
      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accountIds = accSnap.docs.map(doc => doc.id);
      
      if (accountIds.length === 0) {
        toast.error("No accounts found to wipe.");
        return;
      }

      let deletedCount = 0;
      const batch = writeBatch(db);
      
      for (const accId of accountIds) {
        const tQuery = query(collection(db, "trades"), where("account_id", "==", accId));
        const tSnap = await getDocs(tQuery);
        for (const tDoc of tSnap.docs) {
          batch.delete(doc(db, "trades", tDoc.id));
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
      }

      toast.success(`Successfully wiped ${deletedCount} trades.`);
    } catch (error: any) {
      toast.error("Failed to wipe data: " + error.message);
    } finally {
      setIsWiping(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans max-w-5xl mx-auto transition-colors duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
          <i className="las la-cog text-2xl text-blue-500"></i>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Platform Settings</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1 transition-colors duration-300">Manage your security, preferences, and data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile & Security */}
          <div className="bg-white dark:bg-[#111318] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight transition-colors duration-300">
                <i className="las la-shield-alt text-xl text-yellow-500"></i>
                Security & Profile
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors duration-300">Registered Email</label>
                <div className="w-full bg-gray-50 dark:bg-[#0a0f1c] border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-600 dark:text-slate-300 font-bold flex items-center gap-3 cursor-not-allowed transition-colors duration-300">
                  <i className="las la-envelope text-lg text-gray-400 dark:text-slate-500 transition-colors duration-300"></i>
                  {user?.email || "Loading..."}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors duration-300">Full Name</label>
                    <div className="relative">
                      <i className="las la-user text-lg absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors duration-300"></i>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-white dark:bg-[#0a0f1c] border border-gray-300 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 font-medium transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors duration-300">Phone Number</label>
                    <div className="relative">
                      <i className="las la-phone text-lg absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors duration-300"></i>
                      <input 
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-white dark:bg-[#0a0f1c] border border-gray-300 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 font-medium transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors duration-300">Country / Timezone</label>
                  <div className="relative w-full md:w-1/2 pr-0 md:pr-3">
                    <i className="las la-globe-americas text-lg absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors duration-300"></i>
                    <input 
                      type="text" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States (EST)"
                      className="w-full bg-white dark:bg-[#0a0f1c] border border-gray-300 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={isUpdatingProfile || !name.trim()}
                    className="px-6 py-3 bg-gray-100 dark:bg-[#1f2229] hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-slate-800 flex items-center gap-2"
                  >
                    <i className="las la-save text-lg"></i>
                    {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>

              <hr className="border-gray-200 dark:border-slate-800 my-6 transition-colors duration-300" />

              <form onSubmit={handleUpdatePassword}>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors duration-300">Update Password</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <i className="las la-lock text-lg absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors duration-300"></i>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full bg-white dark:bg-[#0a0f1c] border border-gray-300 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 font-medium transition-all"
                      minLength={8}
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\[\]{}|;:',.<>?/~`]).{8,}"
                      title="Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isUpdatingPassword || newPassword.length < 8}
                    className="px-6 py-3 bg-gray-100 dark:bg-[#1f2229] hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-slate-800"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#111318] rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-rose-100 dark:border-rose-900/50">
              <h2 className="text-lg font-bold text-rose-600 dark:text-rose-500 flex items-center gap-2 tracking-tight">
                <i className="las la-exclamation-triangle text-xl"></i>
                Danger Zone
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium transition-colors duration-300 leading-relaxed">
                Wiping data will permanently delete all trades and journal entries. This action cannot be undone. Account balances will remain untouched.
              </p>
              
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isWiping}
                className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/30 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isWiping ? (
                  <>
                    <i className="las la-spinner la-spin text-xl"></i> Wiping...
                  </>
                ) : (
                  <>
                    <i className="las la-trash-alt text-xl group-hover:animate-bounce"></i> Wipe All Data
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Wipe All Trades"
        message="WARNING: This will permanently delete ALL trades across ALL of your accounts. This action cannot be undone. Are you sure?"
        confirmText="Wipe All Trades"
        onConfirm={handleDeleteAllTrades}
        onCancel={() => setIsConfirmOpen(false)}
        isDanger={true}
      />
    </div>
  );
}
