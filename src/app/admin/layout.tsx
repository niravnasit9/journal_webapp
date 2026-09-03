"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import CommandPalette from "@/components/admin/CommandPalette";

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
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-base flex items-center justify-center transition-colors duration-300"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center text-primary p-6 text-center">
        <i className="las la-lock text-6xl text-danger mb-4"></i>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Access Denied</h1>
        <p className="text-secondary mb-6 font-medium">You do not have permission to view the admin panel.</p>
        <Link href="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const navSections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: "las la-tachometer-alt" },
        { name: "Analytics", href: "/admin/analytics", icon: "las la-chart-bar" }
      ]
    },
    {
      title: "PLATFORM DATA",
      items: [
        { name: "Users", href: "/admin/users", icon: "las la-users" },
        { name: "Accounts", href: "/admin/accounts", icon: "las la-wallet" },
        { name: "Trades", href: "/admin/trades", icon: "las la-book-open" },
        { name: "Strategies", href: "/admin/strategies", icon: "las la-chess-knight" },
        { name: "Prop Firms", href: "/admin/prop-firms", icon: "las la-building" }
      ]
    },
    {
      title: "FINANCIALS",
      items: [
        { name: "Subscriptions", href: "/admin/subscriptions", icon: "las la-star" },
        { name: "Billing & Payments", href: "/admin/billing", icon: "las la-file-invoice-dollar", badge: "NEW", tag: "success" }
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "Support", href: "/admin/support", icon: "las la-life-ring" },
        { name: "Notifications", href: "/admin/notifications", icon: "las la-bell" },
        { name: "Audit Logs", href: "/admin/audit-logs", icon: "las la-history" },
        { name: "System Health", href: "/admin/system-health", icon: "las la-heartbeat" },
        { name: "Global Settings", href: "/admin/settings", icon: "las la-cog" },
      ]
    }
  ];

  return (
    <div className="min-h-screen w-full bg-base flex font-sans overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[260px] bg-surface border-r border-default transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none animate-slide-in-left ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
          
          <div className="pt-8 pb-6 px-6 flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-10 h-10 rounded-xl bg-info-bg border border-info/20 flex items-center justify-center shrink-0">
                <i className="las la-user-shield text-xl text-info"></i>
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-lg font-bold text-primary tracking-tight">
                  PROFITPULSE
                </h1>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Admin Panel</p>
              </div>
            </Link>
            
            <button 
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-elevated text-secondary hover:text-primary border border-default"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="las la-times text-lg"></i>
            </button>
          </div>

          <nav className="flex-1 space-y-2 mt-2">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-[10px] text-muted font-bold uppercase tracking-widest mt-6 mb-2 px-4">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-4 py-2 transition-all duration-200 text-sm ${
                          isActive 
                            ? "bg-blue-600/10 text-blue-500 font-bold border-l-2 border-blue-500" 
                            : "text-secondary font-medium hover:bg-elevated hover:text-primary border-l-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <i className={`${item.icon} text-lg ${isActive ? "text-blue-500" : "text-muted group-hover:text-primary transition-colors"}`}></i>
                          <span className="tracking-wide">{item.name}</span>
                        </div>
                        {item.tag && (
                          <Badge variant="info" size="sm">{item.tag}</Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-subtle bg-elevated/30 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-elevated border border-default flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-info">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-primary truncate">{user?.email}</p>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">{role}</p>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-subtle">
            <ThemeToggle />
            <Button 
              variant="danger"
              className="w-full justify-start text-sm transition-colors"
              onClick={handleLogout}
              leftIcon={<i className="las la-sign-out-alt text-lg"></i>}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        {/* Desktop Custom Scrollbar Style override */}
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        {/* Mobile Header Topbar */}
        <div className="md:hidden sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-subtle px-4 py-3 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-info flex items-center justify-center text-inverse">
                <i className="las la-user-shield text-sm"></i>
              </div>
              <h1 className="text-lg font-bold text-primary tracking-tighter leading-none">
                ADMIN<span className="text-info">PANEL</span>
              </h1>
          </Link>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-elevated text-secondary hover:text-primary border border-default"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <i className="las la-bars text-xl"></i>
          </button>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-4 md:p-8 xl:p-10 w-full animate-fade-in-up">
          {children}
        </div>
      </main>
      
      <CommandPalette />
    </div>
  );
}
