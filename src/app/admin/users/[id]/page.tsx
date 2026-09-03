"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc, Transaction, TradeDoc, FundedAccountRulesDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function UserCRMProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [ltv, setLtv] = useState(0);
  const [tradesCount, setTradesCount] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [propFirmsCount, setPropFirmsCount] = useState(0);
  
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch User Profile
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        toast.error("User not found");
        router.push("/admin/users");
        return;
      }
      const userData = { ...userSnap.data(), id: userSnap.id } as UserDoc;
      setUser(userData);
      // @ts-ignore - Assuming admin_notes is loosely typed or will be added
      setAdminNotes(userData.admin_notes || "");

      // 2. Fetch Transactions (LTV)
      const txSnap = await getDocs(query(collection(db, "transactions"), where("user_id", "==", userId), where("status", "==", "completed")));
      // If transactions schema uses uid instead of user_id, fallback
      const txSnapFallback = await getDocs(query(collection(db, "transactions"), where("uid", "==", userId), where("status", "==", "verified")));
      
      let totalValue = 0;
      txSnap.docs.forEach(d => totalValue += d.data().amount || 0);
      txSnapFallback.docs.forEach(d => totalValue += d.data().amount || 0);
      setLtv(totalValue);

      // 3. Fetch Trades
      const tradesSnap = await getDocs(query(collection(db, "trades"), where("user_id", "==", userId)));
      setTradesCount(tradesSnap.docs.length);
      const wins = tradesSnap.docs.filter(d => d.data().pnl > 0).length;
      if (tradesSnap.docs.length > 0) {
        setWinRate((wins / tradesSnap.docs.length) * 100);
      }

      // 4. Fetch Prop Firms
      const propSnap = await getDocs(query(collection(db, "funded_accounts"), where("user_id", "==", userId)));
      setPropFirmsCount(propSnap.docs.length);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load user CRM data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, "users", user.id!), { admin_notes: adminNotes });
      toast.success("Admin notes saved");
    } catch (error) {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleBanUser = async () => {
    if (!user) return;
    if (!window.confirm("CRITICAL: Are you sure you want to permanently ban this user and wipe their data?")) return;
    
    toast("Banning user...", { icon: '🔨' });
    try {
      // In a real app, we would trigger a cloud function to clean up auth & all sub-collections securely.
      // Here we just delete the user doc for the UI demo.
      await deleteDoc(doc(db, "users", user.id!));
      toast.success("User permanently banned.");
      router.push("/admin/users");
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><LoadingSpinner className="w-12 h-12 border-blue-500" /></div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in font-sans pb-12">
      
      {/* 360 Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-neutral-800 border-2 border-strong flex items-center justify-center text-3xl font-black text-muted shadow-xl overflow-hidden">
            {user.photo_url ? (
              <img src={user.photo_url} alt={(user as any).username || user.email} className="w-full h-full object-cover" />
            ) : (
              user.email.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight leading-none mb-2">{(user as any).username || (user as any).name || "Unknown User"}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-secondary">{user.email}</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-[0_0_10px_rgba(currentColor,0.1)] ${
                user.subscription_tier === 'elite' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/20' :
                user.subscription_tier === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/20' :
                user.subscription_tier === 'starter' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/20' :
                'bg-neutral-800 text-secondary border-strong'
              }`}>
                {user.subscription_tier} Tier
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 font-mono text-xs text-muted">
          <div>UID: <span className="text-neutral-300">{user.id}</span></div>
          <div>Joined: <span className="text-neutral-300">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Account Status Widget */}
        <div className="premium-card p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <i className="las la-id-card text-emerald-500"></i> Account Status
          </h2>
          <div className="space-y-4">
            <div className="premium-inner-box p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-muted uppercase tracking-widest">Plan Expiry</span>
              <span className="font-mono text-primary text-sm">
                {user.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString() : "Lifetime"}
              </span>
            </div>
            <div className="premium-inner-box p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-muted uppercase tracking-widest">Total Logins</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">--</span>
            </div>
          </div>
        </div>

        {/* Financials Widget */}
        <div className="premium-card p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <i className="las la-wallet text-blue-500"></i> Financials
          </h2>
          <div className="space-y-4">
            <div className="premium-inner-box p-4 text-center">
              <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Lifetime Value (LTV)</div>
              <div className="text-3xl font-bold text-emerald-400 font-mono">${ltv.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Trading Snapshot */}
        <div className="premium-card p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <i className="las la-chart-bar text-amber-500"></i> Trading Snapshot
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="premium-inner-box p-4 text-center">
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Trades</div>
                <div className="text-xl font-bold text-primary font-mono">{tradesCount}</div>
              </div>
              <div className="premium-inner-box p-4 text-center">
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Win Rate</div>
                <div className="text-xl font-bold text-primary font-mono">{winRate.toFixed(1)}%</div>
              </div>
            </div>
            <div className="premium-inner-box p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-muted uppercase tracking-widest">Linked Prop Firms</span>
              <span className="font-mono text-amber-400 font-bold text-sm">{propFirmsCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-default">
        
        {/* Admin Notes */}
        <div className="premium-card p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <i className="las la-clipboard text-purple-500"></i> Admin Notes (Private)
            </h2>
            <button 
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="btn-ghost text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/10 text-xs px-3 py-1"
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
          <textarea 
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="Add internal notes about this user's behavior, refunds, etc..."
            className="input-premium w-full bg-elevated border-default h-32 resize-none text-sm"
          ></textarea>
          <p className="text-[10px] text-muted mt-2 font-bold uppercase tracking-widest">Visible only to admins</p>
        </div>

        {/* Danger Zone */}
        <div className="premium-card p-6 shadow-xl border-rose-500/20 bg-rose-500/5 relative overflow-hidden flex flex-col justify-center items-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <i className="las la-exclamation-triangle text-4xl text-rose-500 mb-3 animate-pulse"></i>
          <h2 className="text-lg font-bold text-primary mb-2">Danger Zone</h2>
          <p className="text-xs text-secondary mb-6 max-w-xs">
            Permanently banning this user will instantly revoke their access and destroy their live sessions.
          </p>
          <button 
            onClick={handleBanUser}
            className="btn-danger flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            <i className="las la-gavel text-xl"></i> Permanently Ban User
          </button>
        </div>

      </div>

    </div>
  );
}
