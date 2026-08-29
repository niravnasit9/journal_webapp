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
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PaymentMethod, AutoDiscount, CouponCode, GlobalSettings } from "@/lib/firebase/schema";

export default function CheckoutPage() {
  const { tier } = useParams();
  const searchParams = useSearchParams();
  const initialBilling = searchParams.get("billing") || "monthly";
  const { user, loading } = useAuth();
  const router = useRouter();

  const pricingPlans = getPricingPlanList();
  const plan = pricingPlans.find(p => p.id === tier);

  const [billingCycle] = useState<"monthly" | "yearly">(initialBilling as "monthly" | "yearly");
  const [cryptoOptions, setCryptoOptions] = useState<PaymentMethod[]>([]);
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>("");
  const [cryptoInvoiceActive, setCryptoInvoiceActive] = useState(false);
  const [liveCryptoPrice, setLiveCryptoPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  
  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txid, setTxid] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes for crypto payment

  // Promo Code & Global Settings States
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [autoDiscount, setAutoDiscount] = useState<AutoDiscount | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalSettings(docSnap.data() as GlobalSettings);
        }

        const gatewaysSnap = await getDocs(collection(db, "payment_methods"));
        const gateways = gatewaysSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethod)).filter(g => g.isActive);
        setCryptoOptions(gateways);
        if (gateways.length > 0) {
          setSelectedCryptoId(gateways[0].id!);
        }
        
        if (user && plan) {
          const autoSnap = await getDocs(collection(db, "auto_discounts"));
          const autos = autoSnap.docs.map(d => ({ id: d.id, ...d.data() } as AutoDiscount)).filter(a => a.is_active);
          
          let bestAuto: AutoDiscount | null = null;
          for (const a of autos) {
            const planValid = a.target_plans.includes("ALL") || a.target_plans.includes(plan.id.toUpperCase() as any);
            const userValid = a.target_users === "ALL" || (Array.isArray(a.target_users) && a.target_users.some(u => u.uid === user.uid));
            const timeValid = !a.expires_at || new Date(a.expires_at).getTime() > Date.now();
            
            if (planValid && userValid && timeValid) {
              if (!bestAuto || a.discount_pct > bestAuto.discount_pct) {
                bestAuto = a;
              }
            }
          }
          setAutoDiscount(bestAuto);
        }

      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, [user, plan]);

  useEffect(() => {
    const fetchLivePrice = async () => {
      if (!selectedCryptoId) return;
      const selected = cryptoOptions.find(c => c.id === selectedCryptoId);
      if (!selected) return;

      // Stablecoins are generally $1
      if (selected.symbol === "USDT" || selected.symbol === "USDC") {
        setLiveCryptoPrice(1);
        return;
      }

      setFetchingPrice(true);
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${selected.symbol}USDT`);
        const data = await response.json();
        if (data && data.price) {
          setLiveCryptoPrice(Number(data.price));
        } else {
          setLiveCryptoPrice(null); // Fallback if API fails
        }
      } catch (e) {
        console.error("Error fetching live price:", e);
        setLiveCryptoPrice(null);
      }
      setFetchingPrice(false);
    };

    fetchLivePrice();
  }, [selectedCryptoId, cryptoOptions]);

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

  let baseAmount = billingCycle === "yearly" ? plan.priceYearly! : plan.priceMonthly!;
  
  if (globalSettings) {
    if (plan.id === 'starter' && globalSettings.crypto_price_starter) {
      baseAmount = billingCycle === 'yearly' ? globalSettings.crypto_price_starter * 12 : globalSettings.crypto_price_starter;
    } else if (plan.id === 'pro' && globalSettings.crypto_price_pro) {
      baseAmount = billingCycle === 'yearly' ? globalSettings.crypto_price_pro * 12 : globalSettings.crypto_price_pro;
    } else if (plan.id === 'elite' && globalSettings.crypto_price_elite) {
      baseAmount = billingCycle === 'yearly' ? globalSettings.crypto_price_elite * 12 : globalSettings.crypto_price_elite;
    }
  }

  // Calculate Best Discount
  let discountToApply = 0;
  if (autoDiscount && autoDiscount.is_active) {
    discountToApply = autoDiscount.discount_pct;
  }
  if (appliedCoupon && appliedCoupon.is_active && appliedCoupon.discount_pct > discountToApply) {
    discountToApply = appliedCoupon.discount_pct;
  }

  const discountAmount = baseAmount * (discountToApply / 100);
  const amount = Math.max(0, baseAmount - discountAmount);

  // Live Crypto Math Calculation
  let cryptoRequired = amount;
  let isStablecoin = false;
  let cryptoDecimals = 4;
  
  if (selectedCryptoId) {
    const selected = cryptoOptions.find(c => c.id === selectedCryptoId);
    if (selected) {
      isStablecoin = selected.symbol === "USDT" || selected.symbol === "USDC";
      // Stablecoins only need 2 decimals, volatile coins use 4
      cryptoDecimals = isStablecoin ? 2 : 4;
    }
  }

  // Buffer of 1.5% to account for volatility during transfer (only for volatile cryptos)
  const bufferMultiplier = isStablecoin ? 1 : 1.015; 
  if (liveCryptoPrice) {
    cryptoRequired = (amount / liveCryptoPrice) * bufferMultiplier;
  }

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError(null);
    try {
      const q = query(collection(db, "coupon_codes"), where("code", "==", promoCodeInput.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setPromoError("Invalid coupon code.");
        setAppliedCoupon(null);
        setIsApplyingPromo(false);
        return;
      }

      const codeDoc = querySnapshot.docs[0].data() as CouponCode;
      
      if (!codeDoc.is_active) {
        setPromoError("This coupon code is no longer active.");
        setAppliedCoupon(null);
        setIsApplyingPromo(false);
        return;
      }

      const currentTierId = plan.id.toUpperCase();
      if (!codeDoc.target_plans.includes("ALL") && !codeDoc.target_plans.includes(currentTierId as any)) {
        setPromoError(`This code is not valid for the ${currentTierId} plan.`);
        setAppliedCoupon(null);
        setIsApplyingPromo(false);
        return;
      }

      if (codeDoc.target_users !== "ALL") {
        const isAllowed = codeDoc.target_users.some(u => u.uid === user.uid);
        if (!isAllowed) {
          setPromoError("This code is not assigned to your account.");
          setAppliedCoupon(null);
          setIsApplyingPromo(false);
          return;
        }
      }

      if (autoDiscount && autoDiscount.discount_pct >= codeDoc.discount_pct) {
        setPromoError("An equal or better auto-discount is already applied!");
        setAppliedCoupon(null);
        setIsApplyingPromo(false);
        return;
      }

      setAppliedCoupon(codeDoc);
      toast.success(`Coupon applied! ${codeDoc.discount_pct}% OFF`);
    } catch (e) {
      console.error(e);
      setPromoError("Error applying coupon code");
    }
    setIsApplyingPromo(false);
  };

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
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none text-center relative overflow-hidden">
          
          {/* Decorative Background Blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-emerald-50 dark:ring-emerald-900/20">
              <i className="las la-check text-4xl font-bold"></i>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Payment Successful</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm sm:text-base">
              Your account has been upgraded and your features are now active.
            </p>
            
            {/* Receipt Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 text-left border border-slate-100 dark:border-slate-700/50 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700/50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Activated</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-bold rounded-full capitalize">
                  {plan.name} Tier
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">${amount.toFixed(2)}</span>
              </div>
              
              {cryptoInvoiceActive && selectedCryptoId && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {cryptoOptions.find(c => c.id === selectedCryptoId)?.network} • {cryptoOptions.find(c => c.id === selectedCryptoId)?.symbol}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</span>
                <div className="flex items-center gap-2 max-w-[60%]">
                  <span className="font-mono text-sm text-slate-900 dark:text-white truncate">{txid}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(txid);
                      toast.success("Transaction ID copied");
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
                    title="Copy Transaction ID"
                  >
                    <i className="las la-copy"></i>
                  </button>
                </div>
              </div>
            </div>

            <Link href="/dashboard" className="w-full flex items-center justify-center py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-xl transition-colors shadow-lg shadow-slate-900/20 dark:shadow-white/10 group">
              Go to Dashboard
              <i className="las la-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
            </Link>
          </div>
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
                {appliedCoupon || autoDiscount ? (
                  <>
                    <div className="text-sm font-bold tracking-tight text-slate-400 line-through">${baseAmount.toFixed(2)}</div>
                    <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">${amount.toFixed(2)}</div>
                    <div className="text-xs font-bold text-emerald-500 mt-1 uppercase">
                      {appliedCoupon ? `${appliedCoupon.discount_pct}% OFF COUPON APPLIED` : `${autoDiscount!.discount_pct}% OFF AUTO-DISCOUNT APPLIED`}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold tracking-tight">${amount.toFixed(2)}</div>
                    <div className="text-sm text-slate-500">Total amount</div>
                  </>
                )}
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
            
            {/* PROMO CODE SECTION */}
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Have a promo code?</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCodeInput}
                  onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  disabled={!!appliedCoupon || isApplyingPromo}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors outline-none font-mono disabled:opacity-50"
                />
                {!appliedCoupon ? (
                  <button 
                    onClick={handleApplyPromo}
                    disabled={!promoCodeInput || isApplyingPromo}
                    className="h-10 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isApplyingPromo ? "..." : "Apply"}
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setAppliedCoupon(null);
                      setPromoCodeInput("");
                    }}
                    className="h-10 px-4 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-bold text-sm rounded-lg transition-colors shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
              {promoError && <p className="text-xs text-rose-500 mt-2 font-medium">{promoError}</p>}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              We currently process payments securely via Cryptocurrency. Send <strong className="text-slate-900 dark:text-white">${amount.toFixed(2)}</strong> to the wallet address below and provide your Transaction Hash.
            </p>
            
            {liveCryptoPrice && cryptoOptions.find(c => c.id === selectedCryptoId)?.symbol && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Crypto Required</span>
                  {fetchingPrice ? (
                    <span className="text-xs text-indigo-500 animate-pulse">Live fetching...</span>
                  ) : (
                    <span className="text-xs text-indigo-500">
                      {isStablecoin ? "Pegged 1:1" : "Includes 1.5% buffer"}
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {fetchingPrice ? "..." : `~ ${cryptoRequired.toFixed(cryptoDecimals)} ${cryptoOptions.find(c => c.id === selectedCryptoId)?.symbol}`}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Exchange Rate: 1 {cryptoOptions.find(c => c.id === selectedCryptoId)?.symbol} = ${liveCryptoPrice.toFixed(2)}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Select Network</label>
                <div className={isProcessing || cryptoInvoiceActive ? "opacity-50 pointer-events-none" : ""}>
                  <CustomSelect
                    options={cryptoOptions.map(opt => ({
                      value: opt.id!,
                      label: `${opt.name} (${opt.network})`,
                      logo: opt.logo
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
                          const selected = cryptoOptions.find(c => c.id === selectedCryptoId);
                          const addr = selected?.depositAddress || "";
                          const symbol = selected?.symbol.toUpperCase();
                          const finalCrypto = cryptoRequired.toFixed(cryptoDecimals);
                          
                          if (symbol === "BTC") return `bitcoin:${addr}?amount=${finalCrypto}`;
                          if (symbol === "ETH" || symbol === "BNB") {
                            // Convert to Wei (10^18) for EIP-681 compatibility, avoiding scientific notation
                            // Fallback to raw address if BigInt isn't available, but BigInt is standard in modern JS
                            try {
                              const weiValue = BigInt(Math.floor(parseFloat(finalCrypto) * 1e18)).toString();
                              return `ethereum:${addr}?value=${weiValue}`;
                            } catch (e) {
                              return `ethereum:${addr}`;
                            }
                          }
                          // For ERC20/BEP20/TRC20 tokens (USDT, USDC), just return the raw address 
                          // to prevent wallets from mistakenly sending the native gas token (ETH/BNB)
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
