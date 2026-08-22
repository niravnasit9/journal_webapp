"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/authContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function AdminAuditLogsPage() {
  const { role, loading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role === 'admin') {
      fetchDerivedAuditLogs();
    }
  }, [role]);

  const fetchDerivedAuditLogs = async () => {
    try {
      setDataLoading(true);
      // Fetching all to derive logs. In production, this would be a dedicated 'audit_logs' collection
      const uSnap = await getDocs(collection(db, "users"));
      const aSnap = await getDocs(collection(db, "accounts"));
      const tSnap = await getDocs(collection(db, "trades"));
      
      let derivedLogs: any[] = [];

      uSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.created_at) {
          derivedLogs.push({
            id: `u_${doc.id}`,
            entity: 'User',
            action: 'Account Created',
            user_id: doc.id,
            details: d.email,
            timestamp: d.created_at.toDate ? d.created_at.toDate().getTime() : d.created_at
          });
        }
      });

      aSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.created_at) {
          derivedLogs.push({
            id: `a_${doc.id}`,
            entity: 'Trading Account',
            action: 'Account Linked',
            user_id: d.owner_uid,
            details: `${d.label} (${d.broker})`,
            timestamp: d.created_at.toDate ? d.created_at.toDate().getTime() : d.created_at
          });
        }
      });

      tSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.close_time) {
          derivedLogs.push({
            id: `t_${doc.id}`,
            entity: 'Trade',
            action: 'Trade Executed',
            user_id: d.account_id, // simplified mapping
            details: `${d.direction} ${d.symbol} - $${d.profit_loss.toFixed(2)}`,
            timestamp: new Date(d.close_time).getTime()
          });
        }
      });

      derivedLogs.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(derivedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10 border-info" /></div>;
  }

  if (role !== 'admin') {
    return <div className="p-8 text-center text-danger font-bold">Access Denied</div>;
  }

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    return l.entity.toLowerCase().includes(q) || 
           l.action.toLowerCase().includes(q) || 
           l.details.toLowerCase().includes(q);
  });

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'User': return <div className="w-8 h-8 rounded bg-slate-500/20 text-slate-500 flex items-center justify-center"><i className="las la-user"></i></div>;
      case 'Trading Account': return <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center"><i className="las la-wallet"></i></div>;
      case 'Trade': return <div className="w-8 h-8 rounded bg-indigo-500/20 text-indigo-500 flex items-center justify-center"><i className="las la-exchange-alt"></i></div>;
      default: return <div className="w-8 h-8 rounded bg-secondary/20 text-secondary flex items-center justify-center"><i className="las la-history"></i></div>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <i className="las la-history text-3xl text-info"></i>
            Audit Logs
          </h1>
          <p className="text-secondary text-sm mt-1">Platform-wide activity and security events.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="warning" size="sm">Derived View</Badge>
        </div>
      </div>

      <Card className="overflow-hidden border-default shadow-sm">
        <CardHeader className="bg-elevated/50 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Event Timeline</CardTitle>
          <div className="w-full sm:w-64">
            <Input 
              placeholder="Search events..." 
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
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-secondary">
                    No logs match your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-6 py-4 text-secondary font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getEntityIcon(log.entity)}
                        <span className="font-bold text-primary">{log.entity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-secondary">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-primary max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredLogs.length > 50 && (
            <div className="p-3 text-center text-xs font-bold text-secondary bg-elevated border-t border-subtle">
              Showing most recent 50 events.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
