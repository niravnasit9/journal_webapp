"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number;
  priceYearly?: number;
  isPopular?: boolean;
  features: PlanFeature[];
  buttonText: string;
  buttonAction: string; // e.g. "/dashboard" or "/checkout/starter"
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Base",
    description: "Perfect for beginners testing the waters.",
    features: [
      { name: "Manual Trade Logging", included: true },
      { name: "Up to 3 Strategies", included: true },
      { name: "Basic Analytics Calendar", included: true },
      { name: "Automated Broker Sync", included: false },
      { name: "AI Edge Discovery", included: false },
      { name: "Video Uploads", included: false },
    ],
    buttonText: "Start Free",
    buttonAction: "/dashboard"
  },
  {
    id: "starter",
    name: "Starter",
    description: "For disciplined traders scaling their edge.",
    priceMonthly: 15,
    priceYearly: 12, // per month when billed yearly
    features: [
      { name: "Manual Trade Logging", included: true },
      { name: "Unlimited Strategies", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Pre-Trade Strict Checklist", included: true },
      { name: "Automated Broker Sync", included: false },
      { name: "Video Uploads", included: false },
    ],
    buttonText: "Upgrade to Starter",
    buttonAction: "/checkout/starter"
  },
  {
    id: "pro",
    name: "Pro",
    description: "The complete suite for professional traders.",
    priceMonthly: 39,
    priceYearly: 29,
    isPopular: true,
    features: [
      { name: "Unlimited Strategies", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Pre-Trade Strict Checklist", included: true },
      { name: "Automated Broker Sync", included: true },
      { name: "Strategy Backtesting Engine", included: true },
      { name: "AI Edge Discovery", included: false },
    ],
    buttonText: "Upgrade to Pro",
    buttonAction: "/checkout/pro"
  },
  {
    id: "elite",
    name: "Elite",
    description: "Maximum performance, AI insights, and unlimited media.",
    priceMonthly: 99,
    priceYearly: 79,
    features: [
      { name: "Automated Broker Sync", included: true },
      { name: "Strategy Backtesting Engine", included: true },
      { name: "AI Edge Discovery", included: true },
      { name: "AI Trade Sentiment Analysis", included: true },
      { name: "Unlimited Video Uploads", included: true },
      { name: "1-on-1 Trading Psychologist", included: true },
    ],
    buttonText: "Go Elite",
    buttonAction: "/checkout/elite"
  }
];

export default function PricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050810] flex items-center justify-center">
        <LoadingSpinner className="w-12 h-12 border-[4px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050810] font-sans relative overflow-x-hidden selection:bg-yellow-500/30">
      
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-yellow-400/10 dark:bg-yellow-500/5 rounded-full blur-[100px] md:blur-[150px] animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full blur-[100px] md:blur-[150px] animate-[pulse_10s_ease-in-out_infinite]"></div>
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: `40px 40px`
          }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/70 dark:bg-[#0a0f1c]/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-300">
              <i className="las la-shield-alt text-2xl text-black"></i>
            </div>
            <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">
              ProfitPulse
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm font-bold text-gray-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                Skip for now
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-bold text-gray-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight mb-6">
            Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-400">Trading Edge</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-slate-400 font-medium">
            Join thousands of disciplined traders scaling their accounts with ProfitPulse. Choose the plan that fits your strategy.
          </p>

          {/* Billing Toggle */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-500'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-16 h-8 rounded-full bg-gray-200 dark:bg-slate-800 relative flex items-center p-1 transition-colors hover:bg-gray-300 dark:hover:bg-slate-700 focus:outline-none"
            >
              <div className={`w-6 h-6 rounded-full bg-yellow-500 shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-500'}`}>
              Yearly <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Save 25%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-sm md:max-w-4xl xl:max-w-none mx-auto">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative flex flex-col bg-white/60 dark:bg-[#111318]/60 backdrop-blur-xl rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                plan.isPopular 
                  ? 'border-2 border-yellow-400 shadow-[0_20px_50px_-12px_rgba(250,204,21,0.2)]' 
                  : 'border border-gray-200 dark:border-white/10 shadow-lg'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.id === "free" ? (
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                    <span className="text-gray-500 dark:text-slate-400 font-medium mb-1">/forever</span>
                  </div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">
                      ${billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400 font-medium mb-1">/month</span>
                  </div>
                )}
                {plan.id !== "free" && billingCycle === 'yearly' && (
                  <p className="text-xs text-emerald-500 font-bold mt-2">Billed annually at ${plan.priceYearly! * 12}</p>
                )}
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">What's included</p>
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="las la-check text-xs font-bold"></i>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="las la-times text-xs font-bold"></i>
                        </div>
                      )}
                      <span className={`text-sm font-medium leading-tight ${feature.included ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 dark:text-slate-600 line-through decoration-gray-300 dark:decoration-slate-700'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
                <Link 
                  href={`${plan.buttonAction}${plan.id !== 'free' ? `?billing=${billingCycle}` : ''}`}
                  className={`w-full flex items-center justify-center py-4 rounded-xl font-black transition-all ${
                    plan.isPopular
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-yellow-500/25'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
