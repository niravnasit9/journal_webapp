"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AccountDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useUiStore } from "@/store/useUiStore";
import { useDemo } from "@/lib/demoContext";
import { useTierAccess } from "@/hooks/useTierAccess";
import { DEMO_ACCOUNTS } from "@/lib/adminDemoData";
import MarketSwitcher from "@/components/layout/MarketSwitcher";

import { Tier1Free } from "@/components/risk/tiers/Tier1Free";
import { Tier2Starter } from "@/components/risk/tiers/Tier2Starter";
import { Tier3Pro } from "@/components/risk/tiers/Tier3Pro";
import { Tier4Elite } from "@/components/risk/tiers/Tier4Elite";

export default function RiskCenterPage() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const [accounts, setAccounts] = useState<AccountDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeWorkspace } = useUiStore();
  const isDomestic = activeWorkspace === "DOMESTIC";
  const currencySymbol = isDomestic ? "₹" : "$";

  // Tier Access Logic
  const { activeTierKey } = useTierAccess();
  
  const hasStarterAccess = ['starter', 'pro', 'elite'].includes(activeTierKey);
  const hasProAccess = ['pro', 'elite'].includes(activeTierKey);
  const hasEliteAccess = ['elite'].includes(activeTierKey);

  useEffect(() => {
    if (user) {
      fetchRiskData();
    }
  }, [user, role, isDemoMode]);

  const fetchRiskData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (role === "admin") {
        setAccounts(DEMO_ACCOUNTS);
        setLoading(false);
        return;
      }

      const accQuery = query(collection(db, "accounts"), where("owner_uid", "==", user.uid));
      const accSnap = await getDocs(accQuery);
      const accDocs = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountDoc));
      setAccounts(accDocs);

    } catch (error) {
      console.error("Error fetching risk data:", error);
    } finally {
      setLoading(false);
    }
  };

  const workspaceAccounts = useMemo(() => {
    return accounts.filter(a => 
      (isDomestic && a.market_type === "DOMESTIC") || 
      (!isDomestic && a.market_type !== "DOMESTIC")
    );
  }, [accounts, isDomestic]);

  const totalBalance = workspaceAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in font-sans pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight flex items-center gap-3">
            <i className="las la-shield-alt text-indigo-500"></i> {isDomestic ? 'Domestic' : 'Global'} Risk Centre
          </h1>
          <p className="text-secondary mt-1 max-w-2xl">
            {isDomestic
              ? "Advanced capital protection and behavioral guardrails for your personal domestic trading."
              : "Institutional-grade risk analytics mapped directly to your active tier."}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          
        </div>
      </div>

      <div className="space-y-16">
        
        {/* TIER 1: FREE */}
        <section>
          <Tier1Free 
            accountBalance={totalBalance || 10000} 
            currencySymbol={currencySymbol} 
          />
        </section>

        {/* TIER 2: STARTER */}
        <section>
          <Tier2Starter 
            currencySymbol={currencySymbol} 
            hasAccess={hasStarterAccess} 
          />
        </section>

        {/* TIER 3: PRO */}
        <section>
          <Tier3Pro 
            hasAccess={hasProAccess} 
          />
        </section>

        {/* TIER 4: ELITE */}
        <section>
          <Tier4Elite 
            hasAccess={hasEliteAccess} 
          />
        </section>

      </div>
    </div>
  );
}
