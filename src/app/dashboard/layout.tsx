"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { auth } from "@/lib/firebase/config";
import { sendEmailVerification } from "firebase/auth";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import toast from "react-hot-toast";

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

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
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex items-center justify-center transition-colors duration-300"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  // --- EMAIL VERIFICATION GATE ---
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex flex-col items-center justify-center text-gray-900 dark:text-white p-6 font-sans transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-[#111318] rounded-[24px] p-8 border-2 border-indigo-500/20 shadow-2xl text-center">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="las la-envelope-open-text text-4xl text-indigo-500"></i>
          </div>
          <h1 className="text-3xl font-black mb-3 tracking-tight">Check your email</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">
            We've sent a verification link to <strong className="text-gray-900 dark:text-white">{user.email}</strong>. 
            Please verify your email address to access your dashboard.
          </p>

          <div className="space-y-3">
            <button
              onClick={async () => {
                setIsReloading(true);
                await user.reload(); // Refreshes user data from Firebase
                if (auth.currentUser?.emailVerified) {
                  toast.success("Email verified successfully!");
                  window.location.reload(); // Force full refresh to clear any cached layout state
                } else {
                  toast.error("Email not verified yet. Try again.");
                }
                setIsReloading(false);
              }}
              disabled={isReloading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-70"
            >
              {isReloading ? <LoadingSpinner className="w-5 h-5 border-[2px]" /> : "I've verified my email"}
            </button>
            
            <button
              onClick={async () => {
                setIsResending(true);
                try {
                  await sendEmailVerification(user);
                  toast.success("Verification email sent!");
                } catch (error: any) {
                  if (error.code === "auth/too-many-requests") {
                    toast.error("Please wait a few minutes before resending.");
                  } else {
                    toast.error("Failed to send email. Try again later.");
                  }
                }
                setIsResending(false);
              }}
              disabled={isResending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-[#1a1d24] hover:bg-gray-200 dark:hover:bg-[#252830] text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-all disabled:opacity-70"
            >
              {isResending ? <LoadingSpinner className="w-5 h-5 border-[2px]" /> : "Resend email"}
            </button>

            <button
              onClick={handleLogout}
              className="w-full pt-4 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white transition-colors"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }
  // --- END EMAIL VERIFICATION GATE ---

  // Navigation Data Structure (Trading Journal Specific)
  const navSections: NavSection[] = [
    {
      title: "MAIN MENU",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: "las la-border-all" },
        { name: "All Trades", href: "/dashboard/trades", icon: "las la-book-open" },
        { name: "Global Calendar", href: "/dashboard/calendar", icon: "las la-calendar" },
      ]
    },
    {
      title: "ANALYTICS",
      items: [
        { name: "Performance", href: "/dashboard/analytics", icon: "las la-chart-bar" },
        { name: "Reports", href: "/dashboard/reports", icon: "las la-file-alt", tag: "NEW" },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Settings", href: "/dashboard/settings", icon: "las la-cog" },
        { name: "Support", href: "/dashboard/support", icon: "las la-question-circle" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] text-gray-700 dark:text-slate-300 flex font-sans transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[280px] bg-white dark:bg-black border-r border-gray-200 dark:border-[#222] transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none transition-colors duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
          
          {/* Header/Logo */}
          <div className="pt-8 pb-8 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="las la-shield-alt text-4xl text-gray-900 dark:text-white transition-colors duration-300"></i>
              <div className="flex flex-col leading-tight">
                <span className="text-gray-900 dark:text-white font-black tracking-widest text-lg transition-colors duration-300">JOURNAL</span>
                <span className="text-gray-900 dark:text-white font-bold text-xs uppercase tracking-wider transition-colors duration-300">Trading Platform</span>
              </div>
            </div>
            <button className="md:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="las la-times text-2xl"></i>
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="px-3 space-y-6 flex-1">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="px-4 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-4 py-3 rounded-full transition-all duration-200 text-[15px] font-bold ${
                          isActive 
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black" 
                            : "text-gray-700 dark:text-slate-300 hover:bg-[#f5f5f5] dark:bg-[#1a1a1a] hover:text-gray-900 dark:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <i className={`${item.icon} text-[22px] ${isActive ? "text-black" : "text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:text-white transition-colors"}`}></i>
                          {item.name}
                        </div>
                        
                        {item.badge && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-[#f0f0f0] dark:bg-black text-yellow-500' : 'bg-yellow-500 text-black'}`}>
                            {item.badge}
                          </div>
                        )}
                        {item.tag && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${isActive ? 'bg-[#f0f0f0] dark:bg-black text-yellow-500' : 'bg-yellow-500 text-black'}`}>
                            {item.tag}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

        </div>

        {/* User Profile Footer */}
        <div className="mt-auto px-4 pb-6">
          <div className="bg-white dark:bg-[#111] border border-yellow-200 dark:border-[#222] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-gray-600 dark:text-white font-bold text-sm shrink-0">
                <i className="las la-user"></i>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-black uppercase tracking-widest mt-0.5">{role}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold rounded-xl transition-all text-sm"
              >
                <i className="las la-sign-out-alt"></i>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fafafa] dark:bg-[#0a0f1c] relative">
        {/* Desktop Custom Scrollbar Style override */}
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        {/* Mobile Top Header */}
        <div className="md:hidden h-16 border-b border-yellow-200 dark:border-slate-800 bg-[#f0f0f0] dark:bg-black flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold tracking-tight">
             <i className="las la-shield-alt text-2xl text-gray-900 dark:text-white"></i>
            <span>ProfitPulse</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 dark:text-slate-400 p-2 -mr-2 hover:text-gray-900 dark:text-white"
          >
            <i className="las la-bars text-2xl"></i>
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
