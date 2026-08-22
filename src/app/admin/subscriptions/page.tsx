"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { UserDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const uSnap = await getDocs(collection(db, "users"));
      setUsers(uSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserDoc)));
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10 border-info" /></div>;
  }

  const subs = { free: 0, starter: 0, pro: 0, elite: 0 };
  users.forEach(u => {
    const tier = u.subscription_tier || 'free';
    if (subs[tier as keyof typeof subs] !== undefined) {
      subs[tier as keyof typeof subs]++;
    } else {
      subs.free++;
    }
  });

  const filteredUsers = users.filter(u => {
    const query = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.subscription_tier && u.subscription_tier.toLowerCase().includes(query))
    );
  });

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'elite': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'pro': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'starter': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-star text-3xl text-info"></i>
            Subscriptions
          </h1>
          <p className="text-secondary text-sm mt-1">Manage plans, billing, and user tiers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 border-default shadow-sm border-t-4 border-t-slate-500">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Free Tier</div>
          <div className="text-3xl font-bold text-primary">{subs.free}</div>
        </Card>
        <Card className="p-5 border-default shadow-sm border-t-4 border-t-blue-500">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Starter Tier</div>
          <div className="text-3xl font-bold text-primary">{subs.starter}</div>
        </Card>
        <Card className="p-5 border-default shadow-sm border-t-4 border-t-indigo-500">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Pro Tier</div>
          <div className="text-3xl font-bold text-primary">{subs.pro}</div>
        </Card>
        <Card className="p-5 border-default shadow-sm border-t-4 border-t-yellow-500">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Elite Tier</div>
          <div className="text-3xl font-bold text-primary">{subs.elite}</div>
        </Card>
      </div>

      <Card className="overflow-hidden border-default shadow-sm">
        <CardHeader className="bg-elevated/50 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">User Directory</CardTitle>
          <div className="w-full sm:w-64">
            <Input 
              placeholder="Search users or tiers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<i className="las la-search text-lg"></i>}
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-surface text-secondary text-[11px] font-bold uppercase tracking-widest border-b border-subtle">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface border border-default flex items-center justify-center text-xs font-bold text-primary">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-primary">{u.name || "N/A"}</div>
                          <div className="text-xs text-secondary">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${getTierColor(u.subscription_tier)}`}>
                        {u.subscription_tier || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success" size="sm">Active</Badge>
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {u.created_at ? new Date(u.created_at.toDate ? u.created_at.toDate().getTime() : u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-info hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
