"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { auth, db } from "@/lib/firebase/config";
import { updatePassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTierTheme } from "@/hooks/useTierTheme";
import { useTierAccess } from "@/hooks/useTierAccess";
import { getPricingPlanList } from "@/lib/pricingConfig";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const { user } = useAuth();
  const theme = useTierTheme();
  const { activeTierKey } = useTierAccess();
  
  const pricingPlans = getPricingPlanList();
  const currentPlan = pricingPlans.find(p => p.id === activeTierKey) || pricingPlans[0];
  
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
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className={`w-12 h-12 bg-elevated border border-default rounded-xl flex items-center justify-center`}>
          <i className={`las la-cog text-2xl ${theme.icon}`}></i>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Platform Settings</h1>
          <p className="text-sm text-secondary font-medium mt-1">Manage your security, preferences, and data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-subtle">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2 tracking-tight">
                <i className={`las la-shield-alt text-xl ${theme.icon}`}></i>
                Security & Profile
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Registered Email</label>
                <div className="w-full bg-base border border-default rounded-xl px-4 py-3 text-secondary font-bold flex items-center gap-3 cursor-not-allowed">
                  <i className="las la-envelope text-lg text-muted"></i>
                  {user?.email || "Loading..."}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Full Name</label>
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      leftIcon={<i className="las la-user text-lg"></i>}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Phone Number</label>
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      leftIcon={<i className="las la-phone text-lg"></i>}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Country / Timezone</label>
                  <div className="w-full md:w-1/2 pr-0 md:pr-3">
                    <Input 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States (EST)"
                      leftIcon={<i className="las la-globe-americas text-lg"></i>}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    variant="secondary"
                    disabled={isUpdatingProfile || !name.trim()}
                    leftIcon={<i className="las la-save text-lg"></i>}
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
                  </Button>
                </div>
              </form>

              <hr className="border-subtle my-6" />

              <form onSubmit={handleUpdatePassword}>
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Update Password</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      minLength={8}
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\[\]{}|;:',.<>?/~`]).{8,}"
                      title="Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
                      required
                      leftIcon={<i className="las la-lock text-lg"></i>}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="secondary"
                    disabled={isUpdatingPassword || newPassword.length < 8}
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* Billing & Subscription */}
          <Card className="shadow-sm overflow-hidden">
            <div className="p-6 border-b border-subtle">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2 tracking-tight">
                <i className="las la-credit-card text-xl text-info"></i>
                Billing & Subscription
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-base border border-default rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Current Plan</p>
                    <h3 className="text-xl font-black text-primary capitalize">{currentPlan.name}</h3>
                  </div>
                  <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <i className="las la-check-circle"></i> Active
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary font-medium">Price:</span>
                    <span className="text-primary font-bold">
                      {currentPlan.priceMonthly === 0 ? "Free" : `$${currentPlan.priceMonthly}/mo`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary font-medium">Next Billing:</span>
                    <span className="text-primary font-bold">—</span> {/* To be driven by backend */}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/pricing" className="w-full flex items-center justify-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm">
                  Upgrade Plan
                </Link>
                {/* Note: "Cancel" button is omitted here deliberately unless a billing portal integration is active */}
              </div>
            </div>
          </Card>

          <Card className="border-danger shadow-sm overflow-hidden bg-danger-bg/50">
            <div className="p-6 border-b border-danger/20">
              <h2 className="text-lg font-bold text-danger flex items-center gap-2 tracking-tight">
                <i className="las la-exclamation-triangle text-xl"></i>
                Danger Zone
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-danger/80 font-medium leading-relaxed">
                Wiping data will permanently delete all trades and journal entries. This action cannot be undone. Account balances will remain untouched.
              </p>
              
              <Button
                variant="danger"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isWiping}
                className="w-full"
                leftIcon={isWiping ? <i className="las la-spinner la-spin text-xl"></i> : <i className="las la-trash-alt text-xl group-hover:animate-bounce"></i>}
              >
                {isWiping ? "Wiping..." : "Wipe All Data"}
              </Button>
            </div>
          </Card>
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
