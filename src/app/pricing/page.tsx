"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getPricingPlanList } from "@/lib/pricingConfig";

const pricingPlans = getPricingPlanList();

export default function PricingPage() {
  const { user, tier, loading } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [currentTier, setCurrentTier] = useState<string>("free");

  useEffect(() => {
    if (user && tier) {
      setCurrentTier(tier.toLowerCase());
    }
  }, [user, tier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <LoadingSpinner className="w-12 h-12 border-[4px]" />
      </div>
    );
  }

  // Helper to determine the theme color for each plan
  const getPlanAccent = (id: string) => {
    switch(id) {
      case 'free': return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'starter': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'pro': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
      case 'elite': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      default: return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getButtonAccent = (id: string, isCurrent: boolean) => {
    if (isCurrent) return 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500';
    switch(id) {
      case 'free': return 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white';
      case 'starter': return 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500';
      case 'pro': return 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md shadow-indigo-500/20';
      case 'elite': return 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400';
      default: return 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
              <i className="las la-chart-bar text-xl text-white dark:text-slate-900"></i>
            </div>
            <span className="text-lg font-bold tracking-tight">
              ProfitPulse
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Professional pricing for serious traders.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Select a plan to unlock advanced analytics, automated sync, and psychological insights.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-700 relative flex items-center p-1 transition-colors focus:outline-none"
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-slate-300 shadow-sm transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Yearly <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Save up to 25%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-sm md:max-w-4xl xl:max-w-none mx-auto mb-24">
          {pricingPlans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const accentClass = getPlanAccent(plan.id);
            const buttonClass = getButtonAccent(plan.id, isCurrent);

            return (
              <div 
                key={plan.id}
                className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-6 transition-all duration-200 border ${
                  plan.isPopular 
                    ? 'border-indigo-500 dark:border-indigo-500 shadow-lg shadow-indigo-500/10' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-widest mb-3 border ${accentClass}`}>
                    {plan.name}
                  </span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 h-10">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.id === "free" ? (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold tracking-tight">$0</span>
                      <span className="text-slate-500 text-sm mb-1">/forever</span>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold tracking-tight">
                        ${billingCycle === 'yearly' ? (plan.priceYearly! / 12).toFixed(0) : plan.priceMonthly}
                      </span>
                      <span className="text-slate-500 text-sm mb-1">/month</span>
                    </div>
                  )}
                  {plan.id !== "free" && billingCycle === 'yearly' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Billed annually at ${plan.priceYearly}</p>
                  )}
                  {plan.id !== "free" && billingCycle === 'monthly' && (
                    <p className="text-xs text-transparent mt-1">Spacer</p>
                  )}
                  {plan.id === "free" && (
                     <p className="text-xs text-transparent mt-1">Spacer</p>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  {isCurrent ? (
                    <div className={`w-full flex items-center justify-center py-3 rounded-xl font-medium text-sm transition-all ${buttonClass}`}>
                      Current Plan
                    </div>
                  ) : (
                    <Link 
                      href={`${plan.buttonAction}${plan.id !== 'free' ? `?billing=${billingCycle}` : ''}`}
                      className={`w-full flex items-center justify-center py-3 rounded-xl font-medium text-sm transition-all ${buttonClass}`}
                    >
                      {plan.buttonText}
                    </Link>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto mb-24 hidden md:block">
          <h2 className="text-2xl font-bold text-center mb-10">Compare Features</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6 font-medium text-sm text-slate-500 w-2/5">Feature</th>
                  {pricingPlans.map(plan => (
                    <th key={plan.id} className="py-4 px-6 font-bold text-sm text-center w-[15%]">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                
                {/* Core Trading */}
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td colSpan={5} className="py-3 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Core Trading</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Trade Logging</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Manual</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Auto-Sync</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Auto-Sync</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Auto-Sync</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Trading Strategies</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">1</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">3</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Unlimited</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Unlimited</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Pre-Trade Strict Checklist</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                </tr>

                {/* Analytics & AI */}
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td colSpan={5} className="py-3 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Analytics & AI</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Analytics & Calendar</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Basic</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Basic</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Advanced</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Advanced</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">AI Edge Discovery</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">AI Trade Sentiment</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Backtesting Engine</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                </tr>

                {/* Media & Support */}
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td colSpan={5} className="py-3 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Media & Support</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">Video Uploads</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Standard</td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Unlimited</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">1-on-1 Trading Psychologist</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center text-slate-300 dark:text-slate-700">—</td>
                  <td className="py-4 px-6 text-center"><i className="las la-check text-emerald-500 text-lg"></i></td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-2">Can I upgrade or downgrade later?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Yes. You can seamlessly upgrade to a higher tier at any time. Your billing will be adjusted automatically. Downgrades take effect at the end of your current billing cycle.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-2">What happens to my data if my subscription expires?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Your trading data is always yours. If your premium subscription lapses, your account will revert to the Free tier. You will maintain access to your core data, though premium analytics will be locked.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-2">How are payments processed?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">We process payments securely through our integrated payment provider. We also support Cryptocurrency payments directly through the checkout portal.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
