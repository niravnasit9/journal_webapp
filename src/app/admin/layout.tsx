"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  tag?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Clear stale cookie to prevent infinite redirect loop with middleware
      document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/register");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0f1c] flex items-center justify-center transition-colors duration-300"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0f1c] flex flex-col items-center justify-center text-gray-900 dark:text-white p-6 text-center">
        <i className="las la-lock text-6xl text-indigo-500 mb-4"></i>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Access Denied</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6 font-medium">You do not have permission to view the admin panel.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors shadow-xl">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Navigation Data Structure (Admin Specific)
  const navSections: NavSection[] = [
    {
      title: "ADMIN MENU",
      items: [
        { name: "Overview", href: "/admin/dashboard", icon: "las la-tachometer-alt" },
        { name: "Users", href: "/admin/users", icon: "las la-users" },
        { name: "Accounts", href: "/admin/accounts", icon: "las la-wallet" },
        { name: "Transactions", href: "/admin/transactions", icon: "las la-file-invoice-dollar", tag: "NEW" },
        { name: "Trades", href: "/admin/trades", icon: "las la-book-open" },
        { name: "Strategies", href: "/admin/strategies", icon: "las la-chess-knight", tag: "NEW" },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Support Tickets", href: "/admin/support", icon: "las la-life-ring", tag: "NEW" },
        { name: "Global Settings", href: "/admin/settings", icon: "las la-cog" },
        { name: "Exit to App", href: "/dashboard", icon: "las la-sign-out-alt" },
      ]
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-[#0a0f1c] text-gray-700 dark:text-slate-300 flex font-sans overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[280px] bg-[#f0f0f0] dark:bg-black border-r border-yellow-200 dark:border-[#222] transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none animate-slide-in-left ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
          
          {/* Header/Logo */}
          <div className="pt-8 pb-8 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center border border-indigo-500/20">
                <i className="las la-user-shield text-xl text-gray-900 dark:text-white"></i>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                  Profit<span className="text-indigo-500">Pulse</span>
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Admin Panel</p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <button 
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#1f2229] text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white border border-[#334155]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="las la-times"></i>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-8 mt-2">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="px-3 mb-3 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? "bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20" 
                            : "text-gray-500 dark:text-slate-400 font-semibold hover:bg-[#f9fafb] dark:bg-[#1a1d24] hover:text-gray-900 dark:text-white border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <i className={`${item.icon} text-lg ${isActive ? "text-indigo-500" : "text-gray-400 dark:text-slate-500 group-hover:text-gray-700 dark:text-slate-300"}`}></i>
                          <span className="tracking-wide text-sm">{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="mt-8 px-4">
            <div className="bg-[#f9fafb] dark:bg-[#1a1d24] rounded-2xl p-4 border border-yellow-200 dark:border-[#2a2f3a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-black border border-indigo-200 dark:border-[#334155] flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-indigo-500">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-black uppercase tracking-widest mt-0.5">{role}</p>
                </div>
              </div>
              <div className="space-y-2">
                <ThemeToggle />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 font-bold rounded-xl transition-all text-sm"
                >
                  <i className="las la-sign-out-alt"></i>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#fafafa] dark:bg-[#0a0f1c] relative">
        {/* Mobile Header Topbar */}
        <div className="md:hidden sticky top-0 z-30 bg-[#f0f0f0] dark:bg-black/80 backdrop-blur-md border-b border-yellow-200 dark:border-[#222] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center">
                <i className="las la-user-shield text-sm text-gray-900 dark:text-white"></i>
              </div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                ADMIN<span className="text-indigo-500">PANEL</span>
              </h1>
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1f2229] text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:text-white border border-[#334155]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <i className="las la-bars text-xl"></i>
          </button>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-4 md:p-8 xl:p-10 max-w-7xl mx-auto w-full animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
