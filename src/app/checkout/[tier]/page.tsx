"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";
import Link from "next/link";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CustomSelect from "@/components/ui/CustomSelect";
import { QRCodeSVG } from 'qrcode.react';
import { getPricingPlanList } from "@/lib/pricingConfig";

const cryptoOptions = [
  { id: "USDT_TRC20", name: "Tether (USDT)", network: "TRC20", symbol: "USDT", depositAddress: "TGpphHNdQseJrZ44qNZhTAtNn2GGUskGbJ" },
  { id: "USDT_BEP20", name: "Tether (USDT)", network: "BEP20", symbol: "USDT", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e" },
  { id: "USDT_ERC20", name: "Tether (USDT)", network: "ERC20", symbol: "USDT", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e" },
  { id: "USDC_BEP20", name: "USD Coin (USDC)", network: "BEP20", symbol: "USDC", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e" },
  { id: "USDC_ERC20", name: "USD Coin (USDC)", network: "ERC20", symbol: "USDC", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e" },
  { id: "BTC", name: "Bitcoin", network: "Bitcoin", symbol: "BTC", depositAddress: "bc1qmajmjj820letfa6lxr0y8dp0g2ly54grkwkjmy" },
  { id: "ETH", name: "Ethereum", network: "ERC20", symbol: "ETH", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e" },
  { id: "BNB", name: "Binance Coin", network: "BEP20", symbol: "BNB", depositAddress: "0x0ef925358abc00e64d296fd61c142638e737fa5e" },
  { id: "TRX", name: "Tron", network: "TRC20", symbol: "TRX", depositAddress: "TGpphHNdQseJrZ44qNZhTAtNn2GGUskGbJ" }
];

export default function CheckoutPage() {
  const { tier } = useParams();
  const searchParams = useSearchParams();
  const initialBilling = searchParams.get("billing") || "monthly";
  const { user, loading } = useAuth();
  const router = useRouter();

  const pricingPlans = getPricingPlanList();
  const plan = pricingPlans.find(p => p.id === tier);

  const [billingCycle] = useState<"monthly" | "yearly">(initialBilling as "monthly" | "yearly");
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>("USDT_TRC20");
  const [cryptoInvoiceActive, setCryptoInvoiceActive] = useState(false);
  
  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txid, setTxid] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes for crypto payment

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <LoadingSpinner className="w-12 h-12 border-[4px]" />
      </div>
    );
  }

  const amount = billingCycle === "yearly" ? plan.priceYearly! : plan.priceMonthly!;

  const handleCheckout = async () => {
    if (!cryptoInvoiceActive) {
      setCryptoInvoiceActive(true);
      return;
    }

    if (!txid || txid.trim().length < 10) {
      setVerificationError("Please enter a valid Transaction Hash (TxID)");
      return;
    }

    setIsProcessing(true);
    setVerificationError(null);
    try {
      const response = await fetch('/api/checkout/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          txid: txid.trim(),
          tier: tier,
          cryptoId: selectedCryptoId,
          billingCycle: billingCycle
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Payment verification failed");
      }

      setIsSuccess(true);
      toast.success(`Successfully subscribed to ${plan.name}!`);
    } catch (error: any) {
      console.error("Payment verification failed", error);
      setVerificationError(error.message || "Failed to verify transaction. Please try again.");
      toast.error(error.message || "Verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="las la-check text-3xl font-bold"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your account has been upgraded to the <strong className="text-slate-900 dark:text-white">{plan.name}</strong> plan.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 mb-8 text-left border border-slate-100 dark:border-slate-800 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-slate-900 dark:text-white">${amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-xs text-slate-900 dark:text-white truncate max-w-[150px]">{txid}</span>
            </div>
          </div>

          <Link href="/dashboard" className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      
      {/* Simple Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors">
            <i className="las la-arrow-left"></i> Back to Plans
          </Link>
          <div className="font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <i className="las la-lock text-emerald-500"></i> Secure Checkout
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 py-12 flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Order Summary & Features */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Complete your upgrade</h1>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100 dark:border-slate-800/50">
              <div>
                <span className="inline-block px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest rounded mb-2">
                  {plan.name} Plan
                </span>
                <p className="text-slate-500 text-sm">Billed {billingCycle}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-tight">${amount}</div>
                <div className="text-sm text-slate-500">Total amount</div>
              </div>
            </div>

            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Included Features</h3>
            <ul className="space-y-3">
              {plan.features.filter(f => f.included).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <i className="las la-check-circle text-emerald-500 text-lg"></i>
                  {feature.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Payment */}
        <div className="w-full md:w-[400px]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            <h2 className="font-bold text-lg mb-4">Payment Details</h2>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              We currently process payments securely via Cryptocurrency. Send <strong className="text-slate-900 dark:text-white">${amount}</strong> to the wallet address below and provide your Transaction Hash.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Select Network</label>
                <div className={isProcessing || cryptoInvoiceActive ? "opacity-50 pointer-events-none" : ""}>
                  <CustomSelect
                    options={cryptoOptions.map(opt => ({
                      value: opt.id,
                      label: `${opt.name} (${opt.network})`
                    }))}
                    value={selectedCryptoId}
                    onChange={(val) => setSelectedCryptoId(val)}
                  />
                </div>
              </div>

              {cryptoInvoiceActive && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col items-center mb-6">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">
                      Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                    <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm mx-auto w-fit mb-4">
                      <QRCodeSVG 
                        value={(() => {
                          const addr = cryptoOptions.find(c => c.id === selectedCryptoId)?.depositAddress || "";
                          if (selectedCryptoId === "BTC") return `bitcoin:${addr}?amount=${amount}`;
                          if (selectedCryptoId.includes("ERC20") || selectedCryptoId.includes("BEP20") || selectedCryptoId === "ETH" || selectedCryptoId === "BNB") return `ethereum:${addr}`;
                          return addr;
                        })()} 
                        bgColor="#ffffff" 
                        fgColor="#000000" 
                        includeMargin={true} 
                        level="H" 
                        size={220}
                      />
                    </div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 text-left w-full">Deposit Address</label>
                    <div className="w-full relative group">
                      <input 
                        readOnly 
                        value={cryptoOptions.find(c => c.id === selectedCryptoId)?.depositAddress} 
                        className="w-full h-11 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        onClick={() => {
                          const addr = cryptoOptions.find(c => c.id === selectedCryptoId)?.depositAddress;
                          if (addr) {
                            navigator.clipboard.writeText(addr);
                            toast.success("Address copied!");
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Transaction Hash (TxID)</label>
                    <input 
                      type="text" 
                      placeholder="Paste your TxID here..."
                      className="w-full h-11 min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-none font-mono"
                      value={txid}
                      onChange={(e) => setTxid(e.target.value)}
                      disabled={isProcessing}
                    />
                    {verificationError && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <i className="las la-exclamation-circle"></i> {verificationError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isProcessing || (cryptoInvoiceActive && !txid.trim())}
              className="w-full h-12 min-h-[44px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner className="w-5 h-5 border-2" />
                  Verifying Payment...
                </span>
              ) : (
                cryptoInvoiceActive ? `Complete Order ($${amount})` : "Generate Invoice"
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
              <i className="las la-lock"></i> Encrypted & Secure
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
