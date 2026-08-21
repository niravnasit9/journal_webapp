"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const planDetails: Record<string, { name: string, monthly: number, yearly: number }> = {
  starter: { name: "Starter Plan", monthly: 15, yearly: 144 },
  pro: { name: "Pro Plan", monthly: 39, yearly: 348 },
  elite: { name: "Elite Plan", monthly: 99, yearly: 948 },
};

export default function CheckoutPage() {
  const { tier } = useParams();
  const searchParams = useSearchParams();
  const initialBilling = searchParams.get("billing") || "monthly";
  const { user, loading } = useAuth();
  const router = useRouter();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(initialBilling as "monthly" | "yearly");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "stripe" | "crypto">("card");
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>("USDT_TRC20");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoInvoiceActive, setCryptoInvoiceActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour for crypto payment

  const plan = planDetails[tier as string];

  // Timer for crypto invoice
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cryptoInvoiceActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cryptoInvoiceActive, timeLeft]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
    if (!plan && !loading) {
      router.push("/pricing");
    }
  }, [user, loading, plan, router]);

  if (loading || !user || !plan) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050810] flex items-center justify-center">
        <LoadingSpinner className="w-12 h-12 border-[4px]" />
      </div>
    );
  }

  const amount = billingCycle === "yearly" ? plan.yearly : plan.monthly;

  const handleCheckout = async () => {
    if (paymentMethod === "crypto" && !cryptoInvoiceActive) {
      setCryptoInvoiceActive(true);
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Mock successful payment - update user doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        subscription_tier: tier,
        subscription_status: "active",
        subscription_billing: billingCycle
      });

      toast.success(`Successfully subscribed to ${plan.name}!`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Payment failed", error);
      toast.error("Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cryptoOptions = [
    { id: "USDT_TRC20", name: "Tether (USDT TRC20)", symbol: "USDT", network: "TRC20", rate: 1.0, isRecommended: true, time: "Instant - 15 minutes", depositAddress: "TGpphHNdQseJrZ44qNZhTAtNn2GGUskGbJ", icon: "las la-dollar-sign", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "USDT_BEP20", name: "Tether (USDT BEP20)", symbol: "USDT", network: "BEP20", rate: 1.0, isRecommended: true, time: "Instant - 15 minutes", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e", icon: "las la-dollar-sign", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "USDT_ERC20", name: "Tether (USDT ERC20)", symbol: "USDT", network: "ERC20", rate: 1.0, isRecommended: false, time: "Instant - 15 minutes", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e", icon: "las la-dollar-sign", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "USDC_BEP20", name: "USD Coin (USDC BEP20)", symbol: "USDC", network: "BEP20", rate: 1.0, isRecommended: false, time: "Instant - 15 minutes", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e", icon: "las la-dollar-sign", color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "USDC_ERC20", name: "USD Coin (USDC ERC20)", symbol: "USDC", network: "ERC20", rate: 1.0, isRecommended: false, time: "Instant - 15 minutes", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e", icon: "las la-dollar-sign", color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "BTC", name: "Bitcoin (BTC)", symbol: "BTC", network: "Bitcoin", rate: 0.000016, isRecommended: false, time: "Instant - 1 hour", depositAddress: "bc1qmajmjj820letfa6lxr0y8dp0g2ly54grkwkjmy", icon: "lab la-bitcoin", color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "ETH", name: "Ethereum (ETH)", symbol: "ETH", network: "ERC20", rate: 0.00028, isRecommended: false, time: "Instant - 15 minutes", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e", icon: "lab la-ethereum", color: "text-blue-600", bg: "bg-blue-600/10" },
    { id: "BNB", name: "BNB (BNB)", symbol: "BNB", network: "BEP20", rate: 0.0017, isRecommended: false, time: "Instant - 15 minutes", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e", icon: "las la-coins", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { id: "TRX", name: "TRON (TRX)", symbol: "TRX", network: "TRC20", rate: 6.25, isRecommended: false, time: "Instant - 15 minutes", depositAddress: "TGpphHNdQseJrZ44qNZhTAtNn2GGUskGbJ", icon: "las la-bolt", color: "text-red-500", bg: "bg-red-500/10" },
  ];

  const selectedCrypto = cryptoOptions.find(c => c.id === selectedCryptoId)!;
  const cryptoAmount = (amount * selectedCrypto.rate).toFixed(selectedCrypto.symbol.startsWith('USD') ? 2 : 6);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050810] font-sans relative overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-[150px]"></div>
      </div>

      <header className="relative z-50 h-20 px-6 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/pricing" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold">
          <i className="las la-arrow-left text-xl"></i>
          Back to Plans
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 md:py-12 flex flex-col md:flex-row gap-12">
        
        {/* Left Side: Payment Form */}
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Complete your purchase</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium mb-10">Select a secure payment method below.</p>

          <div className="space-y-6">
            {!cryptoInvoiceActive ? (
              <>
                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === "card" 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md" 
                        : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <i className="las la-credit-card text-2xl"></i>
                    <span className="text-xs font-black uppercase tracking-widest">Card</span>
                  </button>
                  
                  <button 
                    onClick={() => setPaymentMethod("stripe")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === "stripe" 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md" 
                        : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <i className="lab la-stripe text-2xl"></i>
                    <span className="text-xs font-black uppercase tracking-widest">Stripe</span>
                  </button>
                  
                  <button 
                    onClick={() => setPaymentMethod("crypto")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === "crypto" 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md" 
                        : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <i className="lab la-bitcoin text-2xl"></i>
                    <span className="text-xs font-black uppercase tracking-widest">Crypto</span>
                  </button>
                </div>

                {/* Dynamic Payment Details UI */}
                <div className="bg-white/60 dark:bg-[#111318]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[24px] p-6 shadow-xl min-h-[250px]">
              
              {paymentMethod === "card" && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Card Information</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="las la-credit-card text-gray-400 text-lg"></i>
                      </div>
                      <input 
                        type="text" 
                        placeholder="0000 0000 0000 0000" 
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#2a2f3a] rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="w-full px-4 py-3 bg-white dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#2a2f3a] rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">CVC</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="123" 
                          className="w-full px-4 py-3 bg-white dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#2a2f3a] rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <i className="las la-lock text-gray-400"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Name on Card</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className="w-full px-4 py-3 bg-white dark:bg-[#0a0f1c] border border-gray-200 dark:border-[#2a2f3a] rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "stripe" && (
                <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in-95 duration-300 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mb-4">
                    <i className="lab la-stripe text-4xl"></i>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Checkout with Stripe</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium max-w-[250px]">
                    You will be redirected to the secure Stripe checkout portal to complete your purchase.
                  </p>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in-95 duration-300 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                    <i className="lab la-bitcoin text-4xl"></i>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Pay with Crypto</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium max-w-[280px] mb-6">
                    Select a cryptocurrency below. An exact deposit address will be generated on the next step.
                  </p>
                  
                  <div className="flex flex-col gap-3 w-full max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {cryptoOptions.map(coin => (
                      <button
                        key={coin.id}
                        onClick={() => setSelectedCryptoId(coin.id)}
                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${
                          selectedCryptoId === coin.id
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-sm ring-1 ring-orange-500/50"
                            : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${coin.bg} ${coin.color}`}>
                          <i className={`${coin.icon} text-3xl`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold truncate ${selectedCryptoId === coin.id ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-slate-300"}`}>
                              {coin.name}
                            </span>
                            {coin.isRecommended && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs font-medium text-gray-500 dark:text-slate-500">
                            <span className="flex items-center gap-1"><i className="las la-clock"></i> {coin.time}</span>
                            <span className="flex items-center gap-1"><i className="las la-percentage"></i> Fee: 0%</span>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedCryptoId === coin.id ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-slate-700 text-transparent"}`}>
                          <i className="las la-check text-sm"></i>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </>
            ) : (
              /* CRYPTO INVOICE STATE */
              <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-500">
                <div className="bg-gray-50 dark:bg-[#16181d] px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCryptoInvoiceActive(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      <i className="las la-arrow-left text-xl"></i>
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white">Crypto Invoice</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-500/20">
                    <i className="las la-clock text-lg"></i>
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col items-center text-center">
                  <div className="mb-6 w-48 h-48 bg-white p-2 rounded-2xl shadow-md border border-gray-200">
                    {/* Mock QR Code - In production replace with real generator or static images */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedCrypto.depositAddress}`} alt="QR Code" className="w-full h-full opacity-90" />
                  </div>

                  <h3 className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Amount to Send</h3>
                  <div className="flex items-baseline gap-2 mb-6 cursor-pointer group" onClick={() => {
                    navigator.clipboard.writeText(cryptoAmount.toString());
                    toast.success("Amount copied!");
                  }}>
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{cryptoAmount}</span>
                    <span className="text-lg font-bold text-gray-500 dark:text-slate-400">{selectedCrypto.symbol}</span>
                    <i className="las la-copy text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"></i>
                  </div>

                  <h3 className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Deposit Address ({selectedCrypto.network} Network)</h3>
                  <div className="w-full relative group mb-8">
                    <input 
                      readOnly 
                      value={selectedCrypto.depositAddress} 
                      className="w-full bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-center text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCrypto.depositAddress);
                        toast.success("Address copied!");
                      }}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                      <div className="bg-white dark:bg-[#252830] p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="las la-copy text-gray-500"></i>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-left">
                    <i className="las la-info-circle text-blue-500 text-xl shrink-0 mt-0.5"></i>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                      Send exactly <strong>{cryptoAmount} {selectedCrypto.symbol}</strong> to the address above over the <strong>{selectedCrypto.network}</strong> network. Sending via a different network may result in loss of funds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full flex items-center justify-center gap-2 py-4 text-white font-black rounded-xl transition-all shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] disabled:opacity-70 disabled:pointer-events-none ${
                cryptoInvoiceActive 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)]' 
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isProcessing ? (
                <LoadingSpinner className="w-5 h-5 border-[2px]" />
              ) : (
                <>
                  {cryptoInvoiceActive 
                    ? "I have made the payment" 
                    : paymentMethod === "stripe" 
                      ? "Proceed to Stripe" 
                      : paymentMethod === "crypto" 
                        ? "Generate Invoice" 
                        : `Pay $${amount}`}
                  <i className={cryptoInvoiceActive ? "las la-check text-lg" : "las la-arrow-right text-lg"}></i>
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
              <i className="las la-lock mr-1"></i> Secured with 256-bit encryption
            </p>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full md:w-[400px] shrink-0">
          <div className="bg-white/60 dark:bg-[#111318]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[24px] p-8 shadow-xl sticky top-8">
            <h2 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6">Order Summary</h2>
            
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{plan.name}</h3>
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">${amount}</span>
            </div>

            {/* Billing Toggle inside Summary */}
            <div className="mb-6 p-1 bg-gray-100 dark:bg-[#1a1d24] rounded-xl flex items-center">
              <button 
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                  billingCycle === "monthly" 
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                  billingCycle === "yearly" 
                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Yearly <span className="text-emerald-500 ml-1">-25%</span>
              </button>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-white/5 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400 font-medium">Subtotal</span>
                <span className="text-gray-900 dark:text-white font-bold">${amount}.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400 font-medium">Tax</span>
                <span className="text-gray-900 dark:text-white font-bold">$0.00</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-white/5">
              <span className="text-base font-bold text-gray-900 dark:text-white">Total due today</span>
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">${amount}</span>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-gray-500 dark:text-slate-400">{user.email?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Account</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
