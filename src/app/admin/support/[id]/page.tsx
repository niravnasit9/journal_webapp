"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { SupportTicketDoc, TicketMessageDoc } from "@/lib/firebase/schema";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";

export default function AdminTicketDetailPage() {
  const { id: ticketId } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [ticket, setTicket] = useState<SupportTicketDoc | null>(null);
  const [messages, setMessages] = useState<TicketMessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !ticketId) return;

    setLoading(true);
    
    // Listen to Ticket
    const ticketRef = doc(db, "support_tickets", ticketId);
    const unsubTicket = onSnapshot(ticketRef, (docSnap) => {
      if (!docSnap.exists()) {
        toast.error("Ticket not found");
        router.push("/admin/support");
        return;
      }
      setTicket({ id: docSnap.id, ...docSnap.data() } as SupportTicketDoc);
      setLoading(false);
    });

    // Listen to Messages
    const q = query(collection(db, `support_tickets/${ticketId}/messages`));
    const unsubMessages = onSnapshot(q, (msgsSnap) => {
      const msgs = msgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessageDoc));
      msgs.sort((a, b) => {
        const timeA = a.created_at ? a.created_at.toMillis() : Date.now();
        const timeB = b.created_at ? b.created_at.toMillis() : Date.now();
        return timeA - timeB;
      });
      setMessages(msgs);
    });

    return () => {
      unsubTicket();
      unsubMessages();
    };
  }, [user, ticketId, router]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticket || !replyText.trim() || ticket.status === "closed") return;

    try {
      setIsReplying(true);
      await addDoc(collection(db, `support_tickets/${ticket.id}/messages`), {
        ticket_id: ticket.id,
        sender_id: user.uid,
        sender_role: "admin",
        message: replyText.trim(),
        created_at: serverTimestamp()
      });

      await updateDoc(doc(db, "support_tickets", ticket.id), {
        updated_at: serverTimestamp()
      });

      setReplyText("");
      // No need to call fetch due to onSnapshot
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const confirmClose = () => {
    setIsConfirmOpen(true);
  };

  const handleCloseTicket = async () => {
    if (!ticket) return;
    setIsConfirmOpen(false);

    try {
      setIsClosing(true);
      await updateDoc(doc(db, "support_tickets", ticket.id), {
        status: "closed",
        updated_at: serverTimestamp()
      });
      toast.success("Ticket closed successfully");
      // No need to call fetch due to onSnapshot
    } catch (error: any) {
      toast.error("Failed to close ticket: " + error.message);
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white dark:bg-[#0f1115] border-b border-gray-200 dark:border-transparent p-6 transition-colors duration-300 rounded-b-2xl shadow-sm">
        <div>
          <Link href="/admin/support" className="text-sm font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2 inline-flex items-center gap-1">
            <i className="las la-arrow-left"></i> Back to Tickets
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 mt-1">
            {ticket.subject}
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
              ticket.status === 'open' 
                ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
            }`}>
              {ticket.status}
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium font-mono">
              Ticket: #{ticket.id}
            </p>
            <span className="hidden sm:inline text-gray-300 dark:text-slate-600">•</span>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium font-mono flex items-center gap-1">
              <i className="las la-user"></i> {ticket.user_email}
            </p>
          </div>
        </div>

        {ticket.status === "open" && (
          <button 
            onClick={confirmClose}
            disabled={isClosing}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0"
          >
            {isClosing ? <LoadingSpinner className="w-4 h-4 border-[2px]" /> : <i className="las la-lock text-lg"></i>}
            Close Ticket
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl overflow-hidden transition-colors duration-300 flex flex-col h-[65vh] min-h-[500px]">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0a0f1c]/50">
          {messages.map((msg, index) => {
            const isMe = msg.sender_role === "admin";
            return (
              <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(99,102,241,0.2)]' 
                    : 'bg-white dark:bg-[#16181d] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-bl-none shadow-sm'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className={`text-xs font-bold ${isMe ? 'text-indigo-100' : 'text-gray-500 dark:text-slate-400'}`}>
                      {isMe ? 'Admin (You)' : 'User'}
                    </span>
                    <span className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400 dark:text-slate-500'}`}>
                      {msg.created_at ? new Date(msg.created_at.toMillis()).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box */}
        {ticket.status === "open" ? (
          <form onSubmit={handleReply} className="p-4 bg-white dark:bg-[#111318] border-t border-gray-200 dark:border-slate-800">
            <div className="relative">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to the user..."
                rows={4}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-slate-600 resize-none custom-scrollbar pb-14"
                required
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isReplying || !replyText.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-[0_4px_15px_rgba(99,102,241,0.3)] flex items-center gap-2"
                >
                  {isReplying ? <LoadingSpinner className="w-4 h-4 border-[2px]" /> : <><i className="las la-paper-plane text-lg"></i> Send Reply</>}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 bg-gray-50 dark:bg-[#0f1115] border-t border-gray-200 dark:border-slate-800 text-center">
            <i className="las la-lock text-3xl text-gray-400 dark:text-slate-500 mb-2"></i>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400">This ticket has been closed.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Close Support Ticket"
        message="Are you sure you want to close this ticket? The user will no longer be able to reply to this thread."
        confirmText="Close Ticket"
        onConfirm={handleCloseTicket}
        onCancel={() => setIsConfirmOpen(false)}
        isDanger={true}
      />
    </div>
  );
}
