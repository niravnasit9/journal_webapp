"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; subtitle?: string; type: "page" | "user"; href: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Static Admin Routes
  const adminPages = [
    { id: "p1", title: "Dashboard", href: "/admin/dashboard", type: "page" as const },
    { id: "p2", title: "Users CRM", href: "/admin/users", type: "page" as const },
    { id: "p3", title: "Accounts", href: "/admin/accounts", type: "page" as const },
    { id: "p4", title: "Trades Ledger", href: "/admin/trades", type: "page" as const },
    { id: "p5", title: "Strategies", href: "/admin/strategies", type: "page" as const },
    { id: "p6", title: "Prop Firms", href: "/admin/prop-firms", type: "page" as const },
    { id: "p7", title: "Subscriptions", href: "/admin/subscriptions", type: "page" as const },
    { id: "p8", title: "Billing & Payments", href: "/admin/billing", type: "page" as const },
    { id: "p9", title: "Support Tickets", href: "/admin/support", type: "page" as const },
    { id: "p10", title: "Notifications", href: "/admin/notifications", type: "page" as const },
    { id: "p11", title: "Audit Logs", href: "/admin/audit-logs", type: "page" as const },
    { id: "p12", title: "System Health", href: "/admin/system-health", type: "page" as const },
    { id: "p13", title: "Global Settings", href: "/admin/settings", type: "page" as const },
  ];

  // Keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results.length > 0) {
          handleSelect(results[selectedIndex]);
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, results, selectedIndex]);

  // Search logic
  useEffect(() => {
    setSelectedIndex(0);
    if (searchQuery.trim().length === 0) {
      setResults(adminPages);
      return;
    }

    const filteredPages = adminPages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Debounced search for users if query > 2
    if (searchQuery.trim().length > 2) {
      const searchUsers = async () => {
        try {
          const q = query(
            collection(db, "users"),
            where("email", ">=", searchQuery.toLowerCase()),
            where("email", "<=", searchQuery.toLowerCase() + '\uf8ff'),
            limit(5)
          );
          const snap = await getDocs(q);
          const userResults = snap.docs.map(d => ({
            id: d.id,
            title: d.data().email,
            subtitle: d.data().username || "User",
            type: "user" as const,
            href: `/admin/users/${d.id}`
          }));
          setResults([...filteredPages, ...userResults]);
        } catch (error) {
          console.error(error);
          setResults(filteredPages);
        }
      };
      
      const timeoutId = setTimeout(searchUsers, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults(filteredPages);
    }
  }, [searchQuery]);

  const handleSelect = (item: { href: string }) => {
    setIsOpen(false);
    setSearchQuery("");
    router.push(item.href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div 
        className="premium-inner-box w-full max-w-2xl bg-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-neutral-800">
          <i className="las la-search text-2xl text-neutral-500"></i>
          <input 
            type="text" 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a command or search users..."
            className="w-full bg-transparent border-none text-white text-lg py-5 px-4 focus:outline-none focus:ring-0 placeholder-neutral-600 font-sans"
          />
          <div className="flex gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-2 py-1 rounded">
            <span>ESC</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {results.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 font-sans">
              No results found for "{searchQuery}"
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${
                    isSelected 
                      ? "bg-blue-600/10 text-blue-400" 
                      : "text-neutral-300 hover:bg-[#121212]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-500'}`}>
                      <i className={`las ${item.type === 'page' ? 'la-file-alt' : 'la-user'} text-lg`}></i>
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-bold font-sans ${isSelected ? 'text-blue-400' : 'text-white'}`}>{item.title}</span>
                      {item.subtitle && <span className="text-xs text-neutral-500">{item.subtitle}</span>}
                    </div>
                  </div>
                  {item.type === "page" && <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Page</span>}
                </button>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#121212] px-4 py-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-sans">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded">↵</kbd> to select</span>
          </div>
          <div>ProfitPulse Command Palette</div>
        </div>

      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
    </div>
  );
}
