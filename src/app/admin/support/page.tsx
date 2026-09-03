"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SupportTicketDoc, TicketMessageDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicketDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDoc | null>(null);
  const [messages, setMessages] = useState<TicketMessageDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "support_tickets"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as SupportTicketDoc));
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTickets(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const q = query(collection(db, "ticket_messages"));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as TicketMessageDoc))
        .filter(m => m.ticket_id === ticketId);
      data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openTicket = (ticket: SupportTicketDoc) => {
    setSelectedTicket(ticket);
    setMessages([]);
    setIsModalOpen(true);
    fetchMessages(ticket.id);
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "support_tickets", selectedTicket.id), { status: "closed" });
      toast.success("Ticket closed");
      setIsModalOpen(false);
      fetchTickets();
    } catch (error) {
      toast.error("Failed to close ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const openTicketsCount = tickets.filter(t => t.status === "open").length;
  const closedToday = tickets.filter(t => t.status === "closed" && new Date(t.updated_at).toDateString() === new Date().toDateString()).length;

  // Filter
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (searchQuery && !t.user_email.toLowerCase().includes(searchQuery.toLowerCase()) && !t.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-page text-white">Support & Tickets</h1>
        <p className="text-sm text-secondary mt-1">Manage user inquiries and technical support requests.</p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Open Tickets</div>
          <div className="text-3xl font-bold text-white">{openTicketsCount}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Resolved Today</div>
          <div className="text-3xl font-bold text-white">{closedToday}</div>
        </div>
        
        <div className="premium-card p-6 shadow-xl relative overflow-hidden group border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Avg Response Time</div>
          <div className="text-3xl font-bold text-white">&lt; 2 Hrs</div>
        </div>
      </div>

      {/* The Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="bg-elevated border-b border-default flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Inbox</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium bg-black border-default text-sm"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-premium bg-black border-default text-sm font-bold text-secondary"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#1a1a1a] text-muted text-[10px] font-bold uppercase tracking-widest border-b border-default">
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">User Email</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><LoadingSpinner className="w-8 h-8 mx-auto border-blue-500" /></td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted font-bold">No tickets match your criteria.</td></tr>
              ) : (
                filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted">#{t.id.substring(0,8)}</td>
                    <td className="px-6 py-4 font-bold text-white">{t.user_email}</td>
                    <td className="px-6 py-4 text-neutral-300 truncate max-w-[200px]">{t.subject}</td>
                    <td className="px-6 py-4">
                      {t.status === "open" 
                        ? <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Open</span>
                        : <span className="bg-neutral-800 text-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Closed</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-xs">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openTicket(t)}
                        className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center ml-auto"
                        title="Resolve Ticket"
                      >
                        <i className="las la-eye text-xl"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-2xl p-0 shadow-2xl animate-in zoom-in-95 border border-default overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-6 border-b border-default bg-elevated flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight mb-1">{selectedTicket.subject}</h2>
                <div className="text-xs text-secondary flex items-center gap-3">
                  <span><i className="las la-user"></i> {selectedTicket.user_email}</span>
                  <span><i className="las la-clock"></i> {new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                <i className="las la-times text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-black/50">
              {messages.length === 0 ? (
                <div className="text-center text-muted italic py-12">No messages found.</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      m.sender_role === 'admin' 
                        ? 'bg-blue-600/20 border border-blue-500/30 text-white rounded-tr-sm' 
                        : 'bg-[#1a1a1a] border border-default text-neutral-200 rounded-tl-sm'
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                        {m.sender_role === 'admin' ? 'Support Agent' : 'User'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-default bg-elevated">
              {selectedTicket.status === "open" ? (
                <div className="space-y-4">
                  <textarea 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="input-premium w-full bg-black border-default h-24 resize-none"
                  ></textarea>
                  <div className="flex justify-between items-center">
                    <button onClick={handleCloseTicket} className="btn-ghost text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" disabled={isSubmitting}>
                      <i className="las la-times-circle"></i> Close Ticket
                    </button>
                    <button className="btn-primary" disabled={isSubmitting}>
                      <i className="las la-paper-plane"></i> Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-amber-500 font-bold text-sm uppercase tracking-widest bg-amber-500/10 py-3 rounded-lg border border-amber-500/20">
                  <i className="las la-lock mr-2"></i> This ticket is closed
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
