"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { SupportTicketDoc } from "@/lib/firebase/schema";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function UserSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New ticket form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(
      collection(db, "support_tickets"),
      where("user_id", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicketDoc));
      fetched.sort((a, b) => (b.updated_at?.toMillis() || 0) - (a.updated_at?.toMillis() || 0));
      setTickets(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch tickets", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      const ticketRef = await addDoc(collection(db, "support_tickets"), {
        user_id: user.uid,
        user_email: user.email,
        subject: subject.trim(),
        status: "open",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Add the initial message
      await addDoc(collection(db, `support_tickets/${ticketRef.id}/messages`), {
        ticket_id: ticketRef.id,
        sender_id: user.uid,
        sender_role: "user",
        message: message.trim(),
        created_at: serverTimestamp()
      });

      toast.success("Support ticket created!");
      setIsModalOpen(false);
      setSubject("");
      setMessage("");
      // fetchTickets() is no longer needed due to onSnapshot
    } catch (error: any) {
      toast.error(error.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f1115] border-b border-gray-200 dark:border-transparent p-4 md:px-6 md:py-6 transition-colors duration-300 rounded-b-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <i className="las la-life-ring text-blue-500"></i> Support Tickets
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 font-medium mt-1">
            Need help? Open a ticket and our team will get back to you.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all shrink-0"
        >
          <i className="las la-plus text-[16px]"></i>
          Open New Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-[#fafafa] dark:bg-[#0a0f1c] text-xs font-bold text-secondary dark:text-slate-500 uppercase tracking-widest border-b border-yellow-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8"><LoadingSpinner /></td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="las la-inbox text-3xl text-secondary dark:text-slate-500"></i>
                    </div>
                    <p className="text-muted dark:text-slate-400 font-medium">You don't have any support tickets yet.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-100 dark:hover:bg-[#16181d] transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono text-xs text-secondary dark:text-slate-500">
                      #{ticket.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        ticket.status === 'open' 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-gray-500/10 text-muted border border-gray-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted dark:text-slate-400 font-medium">
                      {ticket.updated_at ? new Date(ticket.updated_at.toMillis()).toLocaleString() : "Just now"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/support/${ticket.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        View <i className="las la-arrow-right"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#fafafa]/80 dark:bg-[#0a0f1c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-yellow-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-5 border-b border-yellow-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0f1523]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                <i className="las la-life-ring text-2xl text-blue-500"></i> Open Support Ticket
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-gray-900 dark:hover:text-white transition-colors">
                <i className="las la-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted dark:text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. Issue connecting Exness account" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium placeholder:text-secondary dark:placeholder:text-slate-600" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted dark:text-slate-400 uppercase tracking-wider mb-2">How can we help?</label>
                <textarea 
                  placeholder="Describe your issue in detail..." 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  rows={5}
                  className="w-full bg-[#fafafa] dark:bg-[#0a0f1c] border border-yellow-200 dark:border-slate-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium placeholder:text-secondary dark:placeholder:text-slate-600 resize-none custom-scrollbar" 
                  required 
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-muted dark:text-slate-400 hover:text-gray-900 dark:text-white transition-colors rounded-lg hover:bg-[#e5e7eb] dark:bg-slate-800">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 text-black px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center gap-2">
                  {isSubmitting ? <><i className="las la-spinner la-spin text-lg"></i> Submitting...</> : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
