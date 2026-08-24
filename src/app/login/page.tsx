"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import Link from "next/link";

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "Login failed. Please check your credentials and try again.";
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && !loading) {
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, role, loading]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0f1c]">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Please enter your password.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let role = "user";
      if (userDocSnap.exists()) {
        role = userDocSnap.data().role;
      } else {
        const nameFallback = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: nameFallback,
          role: "user",
          created_at: new Date(),
        });
      }

      // Set session cookie (httpOnly not available on client, but we keep it short-lived)
      document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Strict`;

      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccessMsg("Password reset email sent! Check your inbox.");
      setResetEmail("");
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0f1c] text-gray-900 dark:text-white relative overflow-hidden font-sans transition-colors duration-500 px-4">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-amber-400/5 dark:bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand */}
      <div className="mb-8 relative z-10 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-xl">
          <i className="las la-chart-bar text-2xl text-white dark:text-gray-900"></i>
        </div>
        <h1 className="text-2xl font-black tracking-tighter">
          Profit<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
        </h1>
      </div>

      <div className="bg-white/90 dark:bg-[#111318]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full max-w-[440px] border border-gray-100 dark:border-slate-800/50 relative z-10">

        {!resetMode ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">Welcome Back</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Sign in to your ProfitPulse account</p>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3">
                <i className="las la-exclamation-circle text-xl mt-0.5 shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative group">
                  <i className="las la-envelope absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1 pr-1">
                  <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => { setResetMode(true); setError(""); setResetEmail(email); }}
                    className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <i className="las la-lock absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-indigo-500 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`las ${showPassword ? "la-eye-slash" : "la-eye"} text-xl`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black py-4 px-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><i className="las la-spinner la-spin text-xl"></i> Signing in...</>
                ) : (
                  <><i className="las la-sign-in-alt text-xl"></i> Sign In</>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm font-semibold text-gray-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-black transition-colors underline decoration-2 underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500">
                Create one now
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="las la-envelope text-3xl text-indigo-500"></i>
              </div>
              <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">Reset Password</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Enter your email and we&apos;ll send you a reset link</p>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3">
                <i className="las la-exclamation-circle text-xl mt-0.5 shrink-0"></i>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3">
                <i className="las la-check-circle text-xl mt-0.5 shrink-0"></i>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative group">
                  <i className="las la-envelope absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => { setResetEmail(e.target.value); setError(""); }}
                    className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="reset-submit"
                disabled={resetLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <><i className="las la-spinner la-spin text-xl"></i> Sending...</>
                ) : (
                  <><i className="las la-paper-plane text-xl"></i> Send Reset Link</>
                )}
              </button>
            </form>

            <button
              onClick={() => { setResetMode(false); setError(""); setSuccessMsg(""); }}
              className="mt-6 w-full text-center text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1"
            >
              <i className="las la-arrow-left"></i> Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
