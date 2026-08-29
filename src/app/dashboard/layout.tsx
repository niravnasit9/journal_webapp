"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { auth, db } from "@/lib/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { GlobalSettings } from "@/lib/firebase/schema";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { useTierTheme } from "@/hooks/useTierTheme";
import { useDemo } from "@/lib/demoContext";
import UpgradeCelebration from "@/components/ui/UpgradeCelebration";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PlanRenewalBanner } from "@/components/subscription/PlanRenewalBanner";
import { useSubscriptionExpiry } from "@/hooks/useSubscriptionExpiry";

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
  const { user, role, tier, loading, userDoc } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  
  const { isExpired } = useSubscriptionExpiry(userDoc);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalSettings(docSnap.data() as GlobalSettings);
        }
      } catch (e) {
        console.error("Failed to load global settings", e);
      }
    };
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      } else if (!user.emailVerified && role !== "admin") {
        window.location.href = "/verify-email";
      }
    }
  }, [user, loading, router, role]);

  const theme = useTierTheme();

  const handleLogout = async () => {
    await auth.signOut();
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
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

  if (loading || !user || (!user.emailVerified && role !== "admin")) {
    return <div className="min-h-screen bg-base flex items-center justify-center transition-colors duration-300"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  const navSections: NavSection[] = [
    {
      title: "WORKSPACE",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: "las la-border-all" },
        { name: "Accounts", href: "/dashboard/accounts", icon: "las la-wallet" }
      ]
    },
    {
      title: "TRADING",
      items: [
        { name: "All Trades", href: "/dashboard/trades", icon: "las la-book-open" },
        { name: "Strategies", href: "/dashboard/strategies", icon: "las la-chess-knight" },
        { name: "Calendar", href: "/dashboard/calendar", icon: "las la-calendar" },
      ]
    },
    {
      title: "ANALYTICS",
      items: [
        { name: "Analytics", href: "/dashboard/analytics", icon: "las la-chart-pie" },
        { name: "Risk Center", href: "/dashboard/risk", icon: "las la-shield-alt" },
        { name: "Insights", href: "/dashboard/insights", icon: "las la-lightbulb" },
        { name: "Reports", href: "/dashboard/reports", icon: "las la-file-alt" },
      ]
    },
    {
      title: "RESOURCES",
      items: [
        { name: "Prop Firms", href: "/dashboard/prop-firms", icon: "las la-building" },
        { name: "Goals", href: "/dashboard/goals", icon: "las la-bullseye" },
        { name: "Support", href: "/dashboard/support", icon: "las la-question-circle" },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Notifications", href: "/dashboard/notifications", icon: "las la-bell" },
        { name: "Transactions", href: "/dashboard/transactions", icon: "las la-cog" },
        { name: "Settings", href: "/dashboard/settings", icon: "las la-cog" },
      ]
    }
  ];

  if (role === "admin") {
    navSections[navSections.length - 1].items.push({
      name: "Return to Admin",
      href: "/admin/dashboard",
      icon: "las la-user-shield",
      tag: "ADMIN"
    });
  }

  return (
    <div className="min-h-screen bg-base flex font-sans transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[280px] bg-surface border-r border-subtle transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none animate-slide-in-left ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
          
          <div className="pt-8 pb-8 px-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <i className={`las la-shield-alt text-3xl transition-colors duration-300 ${theme.icon}`}></i>
              <div className="flex flex-col leading-tight">
                <span className="text-primary font-bold tracking-widest text-lg transition-colors duration-300">PROFITPULSE</span>
                <UpgradeCelebration tier={tier}>
                  <span className={`${theme.textHighlight} text-[10px] uppercase tracking-wider transition-colors duration-300`}>{tier ? tier.toUpperCase() : "FREE"} PLAN</span>
                </UpgradeCelebration>
              </div>
            </Link>
            <button className="md:hidden text-secondary hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="las la-times text-2xl"></i>
            </button>
          </div>

          <nav className="px-3 space-y-6 flex-1">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="px-4 text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.href === '/dashboard' 
                      ? pathname === '/dashboard' 
                      : (pathname === item.href || pathname.startsWith(`${item.href}/`));
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 rounded-lg ${
                          isActive 
                            ? theme.sidebarActive 
                            : 'text-secondary hover:bg-elevated mx-2'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <i className={`${item.icon} text-xl ${isActive ? theme.icon : "text-muted group-hover:text-primary transition-colors"}`}></i>
                          <span className={isActive ? "font-semibold" : "font-medium"}>{item.name}</span>
                        </div>
                        
                        {item.tag && (
                          <Badge variant="info" size="sm">{item.tag}</Badge>
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
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <label className="relative w-10 h-10 rounded-full bg-elevated flex items-center justify-center text-primary font-bold text-sm shrink-0 cursor-pointer overflow-hidden group border border-default">
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
                    <Input 
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="px-2 py-1 text-xs"
                    />
                    <button onClick={handleSaveName} className="text-success">
                      <i className="las la-check-circle text-lg"></i>
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="text-muted hover:text-danger">
                      <i className="las la-times-circle text-lg"></i>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/name cursor-pointer" onClick={() => { setNewDisplayName(user.displayName || user.email || ""); setIsEditingName(true); }}>
                    <p className="text-sm font-bold text-primary truncate" title={user.displayName || user.email || ""}>
                      {user.displayName || user.email}
                    </p>
                    <i className="las la-pen text-muted opacity-0 group-hover/name:opacity-100 transition-opacity"></i>
                  </div>
                )}
                <div className={`text-xs font-bold truncate uppercase tracking-widest ${theme.textHighlight}`}>
                  {tier ? tier : "FREE"} PLAN
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-subtle space-y-3">
              {role === "admin" && (
                <Button 
                  variant={isDemoMode ? "primary" : "secondary"}
                  onClick={toggleDemoMode}
                  className="w-full relative overflow-hidden group"
                  leftIcon={<i className={`las text-lg ${isDemoMode ? 'la-toggle-on text-white' : 'la-toggle-off'}`}></i>}
                >
                  {isDemoMode ? (
                    <span className="font-bold">Demo Mode Active</span>
                  ) : (
                    <span>Enable Demo Mode</span>
                  )}
                  {isDemoMode && (
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  )}
                </Button>
              )}
              <ThemeToggle />
              <Button 
                variant="danger" 
                onClick={handleLogout}
                className="w-full"
                leftIcon={<i className="las la-sign-out-alt text-lg"></i>}
              >
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-base">
        {globalSettings?.global_announcement && (
          <div className="bg-blue-600/20 border-b border-blue-500/50 w-full px-4 py-2 flex items-center justify-center text-center backdrop-blur-md z-50">
            <p className="text-blue-400 text-sm font-semibold flex items-center gap-2">
              <i className="las la-bullhorn text-lg"></i>
              {globalSettings.global_announcement}
            </p>
          </div>
        )}
        {/* Desktop Custom Scrollbar Style override */}
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        {/* Mobile Top Header */}
        <div className="md:hidden h-16 border-b border-subtle bg-surface flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold tracking-tight">
             <i className="las la-shield-alt text-2xl text-primary"></i>
            <span>ProfitPulse</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-secondary p-2 -mr-2 hover:text-primary"
          >
            <i className="las la-bars text-2xl"></i>
          </button>
        </div>

        {/* Upgrade Banner - Only show if free */}
        {(tier === 'free' || !tier) && (
          <div className={`m-4 rounded-xl p-3 border border-default flex items-center justify-between bg-elevated shadow-sm`}>
            <div>
              <h5 className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">Upgrade Plan</h5>
              <p className="text-[10px] text-secondary font-medium">Unlock more features</p>
            </div>
            <Link href="/pricing" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm bg-primary text-inverse`}>
              <i className="las la-arrow-right"></i>
            </Link>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 animate-fade-in-up flex flex-col">
          <PlanRenewalBanner />
          {isExpired ? (
            <div className="premium-card text-center py-20 my-auto shadow-2xl">
              <i className="las la-lock text-6xl text-amber-500 mb-4 animate-bounce"></i>
              <h2 className="heading-page mb-2">Your Plan Has Expired</h2>
              <p className="text-neutral-400 mb-8 max-w-md mx-auto">Renew your plan to unlock your data and maintain full access to our premium analytics command center.</p>
              <Link href="/pricing" className="btn-primary inline-flex">
                Renew Plan
              </Link>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
