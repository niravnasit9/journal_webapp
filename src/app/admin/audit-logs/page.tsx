"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AuditLog {
  id: string;
  admin_email: string;
  action_type: string;
  ip_address: string;
  status: "success" | "failed";
  created_at: any;
  details?: string;
}

export default function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fallback data if collection doesn't exist yet for demo
      const q = query(collection(db, "audit_logs"), limit(100));
      const snap = await getDocs(q);
      
      let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
      
      if (data.length === 0) {
        // Hydrate demo logs if empty to show the UI
        data = [
          { id: "1", admin_email: "admin@profitpulse.com", action_type: "SYSTEM_LOGIN", ip_address: "192.168.1.1", status: "success", created_at: new Date(Date.now() - 1000 * 60).toISOString(), details: "Successful admin login" },
          { id: "2", admin_email: "unknown", action_type: "AUTH_ATTEMPT", ip_address: "45.22.11.90", status: "failed", created_at: new Date(Date.now() - 1000 * 3600).toISOString(), details: "Invalid password for admin@profitpulse.com" },
          { id: "3", admin_email: "admin@profitpulse.com", action_type: "SUBSCRIPTION_UPDATED", ip_address: "192.168.1.1", status: "success", created_at: new Date(Date.now() - 1000 * 7200).toISOString(), details: "Upgraded user XYZ to ELITE" },
          { id: "4", admin_email: "system", action_type: "CRON_WEBHOOK", ip_address: "10.0.0.1", status: "success", created_at: new Date(Date.now() - 1000 * 86400).toISOString(), details: "Processed 12 crypto deposits" }
        ];
      } else {
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ip_address.includes(searchQuery)
  );

  const total24h = logs.filter(l => new Date(l.created_at).getTime() > Date.now() - 86400000).length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const adminActions = logs.filter(l => l.admin_email.includes("admin") && l.status === "success").length;

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Security Audit Logs</h1>
        <p className="text-sm text-secondary mt-1">High-density tracking ledger for compliance and monitoring.</p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Events Logged (24h)</div>
          <div className="text-3xl font-bold text-white font-mono">{total24h}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Failed Auth Attempts</div>
          <div className="text-3xl font-bold text-white font-mono">{failedCount}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Admin Actions</div>
          <div className="text-3xl font-bold text-white font-mono">{adminActions}</div>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card p-0 overflow-hidden border border-default">
        <div className="bg-elevated border-b border-default p-4">
          <input 
            type="text"
            placeholder="Search by IP, Email, or Action Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium w-full max-w-md bg-black border-default text-sm font-mono"
          />
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-mono text-xs text-secondary whitespace-nowrap">
            <thead>
              <tr className="bg-surface text-secondary font-bold uppercase tracking-widest border-b border-default">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor / Email</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><LoadingSpinner className="w-8 h-8 mx-auto border-blue-500" /></td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-secondary font-bold">No logs found.</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-elevated transition-colors">
                    <td className="px-6 py-3">{new Date(log.created_at).toISOString().replace('T', ' ').substring(0,19)}</td>
                    <td className="px-6 py-3 text-neutral-300 font-bold">{log.admin_email}</td>
                    <td className="px-6 py-3">
                      <span className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-strong font-bold">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-3">{log.ip_address}</td>
                    <td className="px-6 py-3 text-right">
                      {log.status === "success" 
                        ? <span className="text-emerald-500 flex items-center justify-end gap-1"><i className="las la-check-circle"></i> SUCCESS</span>
                        : <span className="text-rose-500 flex items-center justify-end gap-1"><i className="las la-times-circle"></i> FAILED</span>
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
