"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getPricingPlanList } from "@/lib/pricingConfig";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { AutoDiscount, CouponCode } from "@/lib/firebase/schema";

const allPlans = getPricingPlanList();
// Render all 4 plans (Free, Starter, Pro, Elite)
const pricingPlans = allPlans;

export default function PricingPage() {
  const { user, tier, loading } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [autoDiscounts, setAutoDiscounts] = useState<AutoDiscount[]>([]);
  
  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (user && tier) {
      setCurrentTier(tier.toLowerCase());
    }
  }, [user, tier]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalSettings(docSnap.data());
        }
        
        const autoSnap = await getDocs(collection(db, "auto_discounts"));
        const autos = autoSnap.docs.map(d => ({ id: d.id, ...d.data() } as AutoDiscount)).filter(a => a.is_active);
        setAutoDiscounts(autos);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner className="w-12 h-12 border-[4px]" />
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setPromoError("Please enter a code");
      return;
    }
    
    setIsApplyingPromo(true);
    setPromoError(null);
    
    try {
      const q = query(
        collection(db, "coupon_codes"),
        where("code", "==", couponCodeInput.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setPromoError("Invalid or expired code");
        setAppliedCoupon(null);
      } else {
        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CouponCode;
        if (!coupon.is_active) {
          setPromoError("This code is no longer active");
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
          setCouponCodeInput("");
        }
      }
    } catch (e) {
      setPromoError("Error verifying code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const getButtonAccent = (id: string, isCurrent: boolean) => {
    if (isCurrent) return 'bg-neutral-800 text-neutral-500 cursor-not-allowed';
    switch(id) {
      case 'free': return 'bg-transparent border border-neutral-700 text-white hover:bg-neutral-800';
      case 'pro': return 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500';
      case 'elite': return 'bg-transparent border border-neutral-700 text-white hover:bg-neutral-800';
      default: return 'bg-transparent border border-neutral-700 text-white hover:bg-neutral-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <i className="las la-chart-bar text-xl text-[#0a0a0a]"></i>
            </div>
            <span className="text-lg font-bold tracking-tight">
              ProfitPulse
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:text-blue-500 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Institutional-Grade Analytics. <br className="hidden md:block"/>
            <span className="text-blue-500">Retail Prices.</span>
          </h1>
          <p className="text-lg text-neutral-400">
            Pay securely with Crypto (USDT/USDC). Instant access.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-neutral-500'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-neutral-800 relative flex items-center p-1 transition-colors focus:outline-none"
            >
              <div className={`w-4 h-4 rounded-full bg-blue-500 shadow-sm transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-neutral-500'}`}>
              Yearly <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">Save up to 25%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-sm md:max-w-7xl mx-auto mb-16">
          {pricingPlans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const buttonClass = getButtonAccent(plan.id, isCurrent);
            
            let displayPriceMonthly = plan.priceMonthly;
            let displayPriceYearly = plan.priceYearly;

            if (globalSettings) {
              const ratio = plan.priceYearly! / (plan.priceMonthly! * 12);
              if (plan.id === 'starter' && globalSettings.crypto_price_starter) {
                displayPriceMonthly = globalSettings.crypto_price_starter;
                displayPriceYearly = globalSettings.crypto_price_starter * 12 * ratio;
              }
              if (plan.id === 'pro' && globalSettings.crypto_price_pro) {
                displayPriceMonthly = globalSettings.crypto_price_pro;
                displayPriceYearly = globalSettings.crypto_price_pro * 12 * ratio;
              }
              if (plan.id === 'elite' && globalSettings.crypto_price_elite) {
                displayPriceMonthly = globalSettings.crypto_price_elite;
                displayPriceYearly = globalSettings.crypto_price_elite * 12 * ratio;
              }
            }

            // Find best auto discount
            let bestAuto: AutoDiscount | null = null;
            for (const a of autoDiscounts) {
              const planValid = a.target_plans.includes("ALL") || a.target_plans.includes(plan.id.toUpperCase() as any);
              const userValid = user 
                ? (a.target_users === "ALL" || (Array.isArray(a.target_users) && a.target_users.some(u => u.uid === user.uid)))
                : (a.target_users === "ALL");
              const timeValid = !a.expires_at || new Date(a.expires_at).getTime() > Date.now();
              
              if (planValid && userValid && timeValid) {
                if (!bestAuto || a.discount_pct > bestAuto.discount_pct) {
                  bestAuto = a;
                }
              }
            }
            
            // Check manual coupon applicability
            let manualDiscountPct = 0;
            if (appliedCoupon) {
              const planValid = appliedCoupon.target_plans.includes("ALL") || appliedCoupon.target_plans.includes(plan.id.toUpperCase() as any);
              const userValid = user 
                ? (appliedCoupon.target_users === "ALL" || (Array.isArray(appliedCoupon.target_users) && appliedCoupon.target_users.some(u => u.uid === user.uid)))
                : (appliedCoupon.target_users === "ALL");
              if (planValid && userValid) {
                manualDiscountPct = appliedCoupon.discount_pct;
              }
            }

            const activeDiscountPct = Math.max(bestAuto?.discount_pct || 0, manualDiscountPct);
            const hasDiscount = activeDiscountPct > 0;
            
            let originalPriceMonthly = displayPriceMonthly;
            let originalPriceYearly = displayPriceYearly;
            
            if (hasDiscount) {
              displayPriceMonthly = Math.max(0, displayPriceMonthly! * (1 - (activeDiscountPct / 100)));
              displayPriceYearly = Math.max(0, displayPriceYearly! * (1 - (activeDiscountPct / 100)));
            }

            // Calculate expiration days/hours if applicable (for auto discount only)
            let expiresText = "";
            if (activeDiscountPct === (bestAuto?.discount_pct || 0) && bestAuto?.expires_at) {
              const diffMs = new Date(bestAuto.expires_at).getTime() - Date.now();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays > 0) expiresText = `Expires in ${diffDays} days!`;
              else {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                expiresText = `Expires in ${diffHours} hours!`;
              }
            }

            return (
              <div 
                key={plan.id}
                className={`relative flex flex-col bg-[#121212] rounded-2xl p-8 transition-all duration-200 border ${
                  plan.isPopular 
                    ? 'border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.15)] z-10 scale-105' 
                    : 'border-neutral-800'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-neutral-400 h-10">{plan.description}</p>
                </div>

                <div className="mb-8">
                  {plan.id === "free" ? (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold tracking-tight">$0</span>
                      <span className="text-neutral-500 text-sm mb-1">/forever</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <div className="mb-2">
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded">
                            {activeDiscountPct}% OFF {expiresText && `- ${expiresText}`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        {hasDiscount && (
                          <span className="text-2xl font-bold tracking-tight text-neutral-600 line-through mb-1">
                            ${billingCycle === 'yearly' ? (originalPriceYearly! / 12).toFixed(0) : originalPriceMonthly}
                          </span>
                        )}
                        <span className={`text-4xl font-bold tracking-tight ${hasDiscount ? 'text-emerald-400' : 'text-white'}`}>
                          ${billingCycle === 'yearly' ? (displayPriceYearly! / 12).toFixed(0) : displayPriceMonthly}
                        </span>
                        <span className="text-neutral-500 text-sm mb-1">/month</span>
                      </div>
                      <span className="text-xs text-neutral-500 mt-1">
                        {billingCycle === 'yearly' 
                          ? `Billed annually at $${displayPriceYearly}` 
                          : `Billed annually at $${displayPriceYearly}`}
                      </span>
                    </div>
                  )}
                  {plan.id === "free" && (
                     <p className="text-xs text-transparent mt-1">Spacer</p>
                  )}
                </div>

                {/* Dynamic Features List */}
                <div className="mb-8 flex-1">
                  <ul className="space-y-4">
                    {plan.id === "free" && (
                      <>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Standard Journal</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">1 Account</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Basic Analytics</span></li>
                      </>
                    )}
                    {plan.id === "starter" && (
                      <>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Unlimited Strategies</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Advanced Analytics</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Pre-Trade Strict Checklist</span></li>
                      </>
                    )}
                    {plan.id === "pro" && (
                      <>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Everything in Free</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">MFE/MAE Scatter Plot</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Drawdown Profile</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Unlimited Accounts</span></li>
                      </>
                    )}
                    {plan.id === "elite" && (
                      <>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Everything in Pro</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Monte Carlo Simulator</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">AI Behavioral Prescriptions</span></li>
                        <li className="flex items-start gap-3"><i className="las la-check text-blue-500 mt-0.5"></i><span className="text-sm text-neutral-300">Session Heatmaps</span></li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="mt-auto pt-6">
                  {isCurrent ? (
                    <div className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all ${buttonClass}`}>
                      Current Plan
                    </div>
                  ) : (
                    <Link 
                      href={`${plan.buttonAction}${plan.id !== 'free' ? `?billing=${billingCycle}` : ''}`}
                      className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all ${buttonClass}`}
                    >
                      {plan.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Promo Code Section */}
        <div className="max-w-md mx-auto mb-24">
          <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-6 shadow-lg">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><i className="las la-ticket-alt text-blue-500"></i> Have a promo code?</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={couponCodeInput}
                onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter code" 
                className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors uppercase font-mono"
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={isApplyingPromo}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isApplyingPromo ? "..." : "Apply"}
              </button>
            </div>
            {promoError && <p className="text-rose-500 text-xs mt-2 font-medium">{promoError}</p>}
            {appliedCoupon && <p className="text-emerald-500 text-xs mt-2 font-medium">Coupon applied: {appliedCoupon.discount_pct}% OFF</p>}
          </div>
        </div>

        {/* Feature Matrix Table */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Compare Plans</h2>
            <p className="text-neutral-400 mt-2">Find the right features for your trading workflow.</p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-[#121212]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-neutral-800">
                  <th className="py-5 px-6 font-semibold text-neutral-400 uppercase tracking-wider text-sm w-1/4">Features</th>
                  <th className="py-5 px-6 font-bold text-white text-center text-lg w-[18%]">Free</th>
                  <th className="py-5 px-6 font-bold text-white text-center text-lg w-[18%]">Starter</th>
                  <th className="py-5 px-6 font-bold text-blue-400 text-center text-lg w-[18%] relative">
                    Pro
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  </th>
                  <th className="py-5 px-6 font-bold text-amber-400 text-center text-lg w-[18%]">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">Connected Accounts</td>
                  <td className="py-4 px-6 text-center text-neutral-400 text-sm font-bold">1</td>
                  <td className="py-4 px-6 text-center text-neutral-400 text-sm font-bold">3</td>
                  <td className="py-4 px-6 text-center text-white text-sm font-bold bg-blue-500/5">Unlimited</td>
                  <td className="py-4 px-6 text-center text-white text-sm font-bold">Unlimited</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">MFE / MAE Scatter Plots</td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-blue-500"><i className="las la-check text-xl"></i></td>
                  <td className="py-4 px-6 text-center text-blue-500 bg-blue-500/5"><i className="las la-check text-xl"></i></td>
                  <td className="py-4 px-6 text-center text-amber-500"><i className="las la-check text-xl"></i></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">TradingView Chart Imports</td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-blue-500 bg-blue-500/5"><i className="las la-check text-xl"></i></td>
                  <td className="py-4 px-6 text-center text-amber-500"><i className="las la-check text-xl"></i></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">Drawdown Profile Analysis</td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-blue-500 bg-blue-500/5"><i className="las la-check text-xl"></i></td>
                  <td className="py-4 px-6 text-center text-amber-500"><i className="las la-check text-xl"></i></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">AI Revenge Trading Alerts</td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600 bg-blue-500/5"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-amber-500"><i className="las la-check text-xl"></i></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">Risk of Ruin / Monte Carlo Simulator</td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600 bg-blue-500/5"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-amber-500"><i className="las la-check text-xl"></i></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-neutral-300">Session Heatmaps</td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-neutral-600 bg-blue-500/5"><i className="las la-times"></i></td>
                  <td className="py-4 px-6 text-center text-amber-500"><i className="las la-check text-xl"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
