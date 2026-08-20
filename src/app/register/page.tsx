"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  if (!authLoading && user) {
    router.push("/dashboard");
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create user document in Firestore with their provided name
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        role: "user",
        created_at: new Date()
      });

      // 3. Set cookie for middleware
      document.cookie = `userRole=user; path=/; max-age=86400`; // 1 day expiration

      // 4. Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0f1c] text-gray-900 dark:text-white relative overflow-hidden font-sans transition-colors duration-500 px-4">
      {/* Premium Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-rose-600/5 dark:bg-rose-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Logo/Brand (Optional) */}
      <div className="mb-8 relative z-10 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-xl">
          <i className="las la-user-plus text-2xl text-white dark:text-gray-900"></i>
        </div>
        <h1 className="text-2xl font-black tracking-tighter">
          TRADE<span className="text-indigo-600 dark:text-indigo-400">JOURNAL</span>
        </h1>
      </div>

      <div className="bg-white/90 dark:bg-[#111318]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full max-w-[440px] border border-gray-100 dark:border-slate-800/50 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black mb-3 text-gray-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">
            Join the premium MT5 Journal platform
          </p>
        </div>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
            <i className="las la-exclamation-circle text-xl"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
            <div className="relative group">
              <i className="las la-user absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"></i>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600"
                required
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative group">
              <i className="las la-envelope absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600"
                required
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Password</label>
            <div className="relative group">
              <i className="las la-lock absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#16181d] border border-gray-200 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600"
                required
                placeholder="••••••••"
                minLength={8}
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\[\]{}|;:',.<>?/~`]).{8,}"
                title="Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black py-4 px-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="las la-spinner la-spin text-xl"></i> Creating Account...
              </>
            ) : (
              <>
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-semibold text-gray-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-black transition-colors underline decoration-2 underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
