"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { auth, db } from "@/lib/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { useTierTheme } from "@/hooks/useTierTheme";
import UpgradeCelebration from "@/components/ui/UpgradeCelebration";

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
  const { user, role, tier, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Clear stale cookie to prevent infinite redirect loop with middleware
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/register");
      } else if (!user.emailVerified && role !== "admin") {
        router.push("/verify-email");
      }
    }
  }, [user, loading, router, role]);

  const theme = useTierTheme();

  const handleLogout = async () => {
    await auth.signOut();
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error("Image must be less than 30MB");
      return;
    }

    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result;
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64data })
          });
          const data = await response.json();
          
          if (response.ok && data.url) {
            await updateProfile(user, { photoURL: data.url });
            await setDoc(doc(db, "users", user.uid), { photo_url: data.url }, { merge: true });
            window.location.reload(); 
          }
        } catch (error) {
          console.error(error);
        } finally {
          setUploadingImage(false);
        }
      };
    } catch (error) {
      console.error(error);
      setUploadingImage(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !newDisplayName.trim()) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateProfile(user, { displayName: newDisplayName.trim() });
      await setDoc(doc(db, "users", user.uid), { name: newDisplayName.trim() }, { merge: true });
      setIsEditingName(false);
      toast.success("Profile name updated!");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to update name");
    }
  };

  if (loading || !user || !user.emailVerified) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex items-center justify-center transition-colors duration-300"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  // Navigation Data Structure (Trading Journal Specific)
  const navSections: NavSection[] = [
    {
      title: "MAIN MENU",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: "las la-border-all" },
        { name: "All Trades", href: "/dashboard/trades", icon: "las la-book-open" },
        { name: "Strategies", href: "/dashboard/strategies", icon: "las la-chess-knight" },
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
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[280px] bg-white dark:bg-black border-r border-gray-200 dark:border-[#222] transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none transition-colors duration-300 animate-slide-in-left ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
          
          {/* Header/Logo */}
          <div className="pt-8 pb-8 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className={`las la-shield-alt text-4xl transition-colors duration-300 ${theme.icon}`}></i>
              <div className="flex flex-col leading-tight">
                <span className="text-gray-900 dark:text-white font-black tracking-widest text-lg transition-colors duration-300">JOURNAL</span>
                <UpgradeCelebration tier={tier}>
                  <span className={`${theme.textHighlight} font-black text-xs uppercase tracking-wider transition-colors duration-300`}>{tier ? tier.toUpperCase() : "FREE"}</span>
                </UpgradeCelebration>
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
                        className={`group flex items-center justify-between px-4 py-3 text-sm transition-all duration-300 ${
                          isActive 
                            ? theme.sidebarActive 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 mx-2 rounded-xl'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <i className={`${item.icon} text-[22px] ${isActive ? theme.icon : "text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:text-white transition-colors"}`}></i>
                          {item.name}
                        </div>
                        
                        {item.badge && (
                          <div className={theme.badge}>
                            {item.badge}
                          </div>
                        )}
                        {item.tag && (
                          <span className={theme.badge}>
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

        <div className="mt-auto px-4 pb-6">
          <div className={`bg-white dark:bg-[#111] border rounded-2xl p-4 ${theme.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <label className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-gray-600 dark:text-white font-bold text-sm shrink-0 cursor-pointer overflow-hidden group">
                {uploadingImage ? (
                  <LoadingSpinner className="w-4 h-4 border-[2px]" />
                ) : user.photoURL ? (
                  <>
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="las la-camera text-white"></i>
                    </div>
                  </>
                ) : (
                  <>
                    <i className="las la-user"></i>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="las la-camera text-white"></i>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={uploadingImage} />
              </label>
              <div className="overflow-hidden flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className={`w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-xs text-gray-900 dark:text-white outline-none focus:border-2 ${theme.border}`}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName} className="text-emerald-500 hover:text-emerald-600">
                      <i className="las la-check-circle text-lg"></i>
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="text-gray-400 hover:text-rose-500">
                      <i className="las la-times-circle text-lg"></i>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/name cursor-pointer" onClick={() => { setNewDisplayName(user.displayName || user.email || ""); setIsEditingName(true); }}>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={user.displayName || user.email || ""}>
                      {user.displayName || user.email}
                    </p>
                    <i className="las la-pen text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity"></i>
                  </div>
                )}
                <div className={`text-xs font-black truncate uppercase tracking-widest ${theme.textHighlight}`}>
                  {tier ? tier : "FREE TIER"}
                </div>
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

            {/* Upgrade Banner - Only show if free */}
            {(tier === 'free' || !tier) && (
              <div className={`m-4 rounded-xl p-3 border border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-white/5`}>
                <div>
                  <h5 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-0.5">Upgrade Plan</h5>
                  <p className="text-[9px] text-gray-500 dark:text-slate-400 font-medium">Unlock more features</p>
                </div>
                <Link href="/pricing" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm ${theme.badge}`}>
                  <i className="las la-arrow-right"></i>
                </Link>
              </div>
            )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
