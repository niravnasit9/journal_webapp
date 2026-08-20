"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot } from "firebase/firestore";
import { SupportTicketDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(collection(db, "support_tickets"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicketDoc));
      fetched.sort((a, b) => (b.updated_at?.toMillis() || 0) - (a.updated_at?.toMillis() || 0));
      setTickets(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch tickets", error);
      toast.error("Failed to fetch tickets");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredTickets = tickets.filter(t => filter === "all" || t.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f1115] border-b border-gray-200 dark:border-transparent p-4 md:px-6 md:py-6 transition-colors duration-300 rounded-b-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <i className="las la-life-ring text-indigo-500"></i> Support Tickets
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
            Manage and respond to user support requests.
          </p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-[#16181d] p-1 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filter === "all" ? "bg-white dark:bg-[#20242d] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filter === "open" ? "bg-white dark:bg-[#20242d] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filter === "closed" ? "bg-white dark:bg-[#20242d] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`}
          >
            Closed
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-indigo-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8"><LoadingSpinner /></td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="las la-inbox text-3xl text-gray-400 dark:text-slate-500"></i>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 font-medium">No tickets found.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-100 dark:hover:bg-[#16181d] transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 dark:text-slate-500">
                      #{ticket.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{ticket.user_email}</div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{ticket.user_id}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white max-w-[300px] truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        ticket.status === 'open' 
                          ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                          : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-medium">
                      {ticket.updated_at ? new Date(ticket.updated_at.toMillis()).toLocaleString() : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/support/${ticket.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Manage <i className="las la-arrow-right"></i>
                      </Link>
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
