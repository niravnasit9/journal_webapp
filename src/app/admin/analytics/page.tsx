"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { UserDoc, AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import CustomSelect from "@/components/ui/CustomSelect";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  
  const [timeFilter, setTimeFilter] = useState("30"); // days

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const uSnap = await getDocs(collection(db, "users"));
      setUsers(uSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserDoc)));

      const aSnap = await getDocs(collection(db, "accounts"));
      setAccounts(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc)));

      // In production with huge dbs, you wouldn't fetch all trades at once.
      // But for this analytics view assuming a manageable size for now:
      const tSnap = await getDocs(query(collection(db, "trades")));
      setTrades(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeDoc)));

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10 border-info" /></div>;
  }

  // Filter based on time
  const now = new Date();
  const filterMs = timeFilter === "ALL" ? Infinity : parseInt(timeFilter) * 24 * 60 * 60 * 1000;
  
  const filteredUsers = users.filter(u => {
    if (!u.created_at) return true;
    const t = u.created_at.toDate ? u.created_at.toDate().getTime() : u.created_at;
    return (now.getTime() - t) <= filterMs;
  });

  const filteredAccounts = accounts.filter(a => {
    if (!a.created_at) return true;
    const t = a.created_at.toDate ? a.created_at.toDate().getTime() : a.created_at;
    return (now.getTime() - t) <= filterMs;
  });

  const filteredTrades = trades.filter(t => {
    const time = new Date(t.close_time).getTime();
    return (now.getTime() - time) <= filterMs;
  });

  // Subscriptions distribution
  const subs = { free: 0, starter: 0, pro: 0, elite: 0 };
  users.forEach(u => {
    const tier = u.subscription_tier || 'free';
    if (subs[tier as keyof typeof subs] !== undefined) {
      subs[tier as keyof typeof subs]++;
    } else {
      subs.free++;
    }
  });

  // Prop firm usage
  const firmsUsage: Record<string, number> = {};
  accounts.forEach(a => {
    if (a.prop_firm) {
      firmsUsage[a.prop_firm] = (firmsUsage[a.prop_firm] || 0) + 1;
    }
  });
  const topFirms = Object.entries(firmsUsage).sort((a,b) => b[1] - a[1]).slice(0,5);

  const totalVolume = filteredTrades.reduce((sum, t) => sum + (t.lot_size || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-chart-bar text-3xl text-info"></i>
            Platform Analytics
          </h1>
          <p className="text-secondary text-sm mt-1">Global metrics and growth trends.</p>
        </div>
        <div className="w-48 relative z-20">
          <CustomSelect 
            options={[
              { value: "7", label: "Last 7 Days" },
              { value: "30", label: "Last 30 Days" },
              { value: "90", label: "Last 90 Days" },
              { value: "ALL", label: "All Time" }
            ]}
            value={timeFilter}
            onChange={setTimeFilter}
            icon="las la-calendar"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 border-default shadow-sm hover:border-info transition-colors">
          <div className="flex items-center gap-3 text-secondary font-bold text-xs uppercase tracking-widest mb-2">
            <i className="las la-users text-lg text-info"></i> User Growth
          </div>
          <div className="text-3xl font-bold text-primary">{filteredUsers.length}</div>
          <div className="text-xs text-secondary mt-1 font-medium">New users in period</div>
        </Card>
        
        <Card className="p-5 border-default shadow-sm hover:border-info transition-colors">
          <div className="flex items-center gap-3 text-secondary font-bold text-xs uppercase tracking-widest mb-2">
            <i className="las la-wallet text-lg text-info"></i> Account Growth
          </div>
          <div className="text-3xl font-bold text-primary">{filteredAccounts.length}</div>
          <div className="text-xs text-secondary mt-1 font-medium">New accounts in period</div>
        </Card>

        <Card className="p-5 border-default shadow-sm hover:border-info transition-colors">
          <div className="flex items-center gap-3 text-secondary font-bold text-xs uppercase tracking-widest mb-2">
            <i className="las la-book-open text-lg text-info"></i> Trade Volume
          </div>
          <div className="text-3xl font-bold text-primary">{filteredTrades.length}</div>
          <div className="text-xs text-secondary mt-1 font-medium">Total lots: {totalVolume.toFixed(2)}</div>
        </Card>

        <Card className="p-5 border-default shadow-sm hover:border-info transition-colors">
          <div className="flex items-center gap-3 text-secondary font-bold text-xs uppercase tracking-widest mb-2">
            <i className="las la-star text-lg text-info"></i> Active Traders
          </div>
          <div className="text-3xl font-bold text-primary">
            {new Set(filteredTrades.map(t => t.account_id)).size}
          </div>
          <div className="text-xs text-secondary mt-1 font-medium">Unique accounts traded</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Subscription Distribution */}
        <Card className="border-default shadow-sm overflow-hidden">
          <CardHeader className="bg-elevated/50 border-b border-subtle">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Global Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500"></div> Free</span>
                <span className="font-bold">{subs.free}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Starter</span>
                <span className="font-bold">{subs.starter}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Pro</span>
                <span className="font-bold">{subs.pro}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Elite</span>
                <span className="font-bold">{subs.elite}</span>
              </div>
            </div>
            
            <div className="w-full h-4 bg-elevated rounded-full flex overflow-hidden border border-subtle mt-6">
              <div style={{width: `${(subs.free/users.length)*100}%`}} className="bg-slate-500 h-full"></div>
              <div style={{width: `${(subs.starter/users.length)*100}%`}} className="bg-blue-500 h-full"></div>
              <div style={{width: `${(subs.pro/users.length)*100}%`}} className="bg-indigo-500 h-full"></div>
              <div style={{width: `${(subs.elite/users.length)*100}%`}} className="bg-yellow-500 h-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Prop Firm Usage */}
        <Card className="border-default shadow-sm overflow-hidden">
          <CardHeader className="bg-elevated/50 border-b border-subtle">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Top Prop Firms</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {topFirms.length === 0 ? (
              <div className="text-center text-secondary py-8">No prop firm data available.</div>
            ) : (
              <div className="space-y-4">
                {topFirms.map(([firm, count], idx) => (
                  <div key={firm} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-elevated border border-default flex items-center justify-center text-xs font-bold text-secondary">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-primary">{firm}</span>
                    </div>
                    <div className="text-sm font-bold bg-elevated px-2 py-1 rounded text-secondary">
                      {count} accounts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
