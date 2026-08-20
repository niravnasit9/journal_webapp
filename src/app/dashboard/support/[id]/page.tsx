"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { SupportTicketDoc, TicketMessageDoc } from "@/lib/firebase/schema";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function UserTicketDetailPage() {
  const { id: ticketId } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [ticket, setTicket] = useState<SupportTicketDoc | null>(null);
  const [messages, setMessages] = useState<TicketMessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !ticketId) return;

    setLoading(true);
    
    // Listen to Ticket
    const ticketRef = doc(db, "support_tickets", ticketId);
    const unsubTicket = onSnapshot(ticketRef, (docSnap) => {
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        toast.error("Ticket not found or unauthorized");
        router.push("/dashboard/support");
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
        sender_role: "user",
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

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f1115] border-b border-gray-200 dark:border-transparent p-6 transition-colors duration-300 rounded-b-2xl shadow-sm">
        <div>
          <Link href="/dashboard/support" className="text-sm font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2 inline-flex items-center gap-1">
            <i className="las la-arrow-left"></i> Back to Tickets
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 mt-1">
            {ticket.subject}
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
              ticket.status === 'open' 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
            }`}>
              {ticket.status}
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-2 font-mono">
            Ticket ID: #{ticket.id}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl overflow-hidden transition-colors duration-300 flex flex-col h-[65vh] min-h-[500px]">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0a0f1c]/50">
          {messages.map((msg, index) => {
            const isMe = msg.sender_role === "user";
            return (
              <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
                    : 'bg-white dark:bg-[#16181d] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-bl-none shadow-sm'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className={`text-xs font-bold ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}>
                      {isMe ? 'You' : 'Support Team'}
                    </span>
                    <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'}`}>
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
                placeholder="Type your reply here..."
                rows={3}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-slate-600 resize-none custom-scrollbar pb-12"
                required
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  disabled={isReplying || !replyText.trim()}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 text-black px-6 py-2 rounded-lg text-sm font-bold transition shadow-[0_0_10px_rgba(234,179,8,0.2)] flex items-center gap-2"
                >
                  {isReplying ? <LoadingSpinner className="w-4 h-4 border-[2px]" /> : <><i className="las la-paper-plane text-lg"></i> Send</>}
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

    </div>
  );
}
