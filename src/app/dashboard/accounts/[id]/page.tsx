"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/authContext";
import { useDemo } from "@/lib/demoContext";
import { DEMO_ACCOUNTS, generateTradesForAccount } from "@/lib/adminDemoData";
import { AccountDoc, TradeDoc } from "@/lib/firebase/schema";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AddTradeModal from "@/components/AddTradeModal";
import toast from "react-hot-toast";
import MarketSwitcher from "@/components/layout/MarketSwitcher";

// Dashboard Components
import AccountOverview from "@/components/dashboard/AccountOverview";
import TradingHistory from "@/components/dashboard/TradingHistory";
import TradingOverview from "@/components/dashboard/TradingOverview";
import TradingPsychology from "@/components/dashboard/TradingPsychology";
import { useUiStore } from "@/store/useUiStore";

type TabType = "Account Overview" | "Trading Overview" | "Trading History" | "Psychology";

export default function AccountDetailView() {
  const { id } = useParams();
  const accountId = id as string;
  const router = useRouter();
  const { isDemoMode } = useDemo();
  const { setWorkspace } = useUiStore();
  
  const [account, setAccount] = useState<AccountDoc | null>(null);
  const [trades, setTrades] = useState<TradeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("Account Overview");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      if (isDemoMode) {
        const demoAcc = DEMO_ACCOUNTS.find(a => a.id === accountId);
        if (demoAcc) {
          setAccount(demoAcc);
          const demoTrades = generateTradesForAccount(accountId, 0, 30, 0.55, 1.0);
          demoTrades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
          setTrades(demoTrades);
        } else {
          toast.error("Demo account not found");
          router.push("/dashboard/accounts");
        }
      } else {
        const docRef = doc(db, "accounts", accountId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const accData = docSnap.data() as AccountDoc;
          setAccount(accData);
          setWorkspace(accData.market_type || "GLOBAL");
          
          const q = query(collection(db, "trades"), where("account_id", "==", accountId));
          const tSnap = await getDocs(q);
          const tList = tSnap.docs.map(d => ({ ...d.data(), id: d.id } as TradeDoc));
          tList.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
          setTrades(tList);
        } else {
          toast.error("Account not found");
          router.push("/dashboard/accounts");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId, isDemoMode]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><LoadingSpinner className="w-10 h-10 border-blue-500" /></div>;
  }
  if (!account) {
    return <div className="text-rose-500 p-8 font-bold text-center">Account not found or access denied</div>;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Account Overview":
        return <AccountOverview account={account} trades={trades} />;
      case "Trading Overview":
        return <TradingOverview trades={trades} />;
      case "Trading History":
        return <TradingHistory trades={trades} />;
      case "Psychology":
        return <TradingPsychology trades={trades} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      
      {/* Header Shell */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="heading-page text-white">{account.label}</h1>
            <MarketSwitcher />
          </div>
          <p className="text-sm text-neutral-400">
            {account.broker} • {account.account_type}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <i className="las la-plus text-lg"></i>
            Log Trade
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-neutral-800">
        {(["Account Overview", "Trading Overview", "Trading History", "Psychology"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-neutral-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab Content Router */}
      <div className="pt-4">
        {renderActiveTab()}
      </div>

      {/* Modals */}
      <AddTradeModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accountId={account.id}
        accountCurrency={account.currency}
        onAdded={fetchData}
      />
    </div>
  );
}
