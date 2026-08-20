"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import Link from "next/link";

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 8 characters with a mix of letters, numbers and symbols.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "Registration failed. Please try again.";
  }
}

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: "Very Weak", color: "bg-rose-500" };
  if (score === 2) return { score, label: "Weak", color: "bg-orange-400" };
  if (score === 3) return { score, label: "Fair", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Strong", color: "bg-emerald-400" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || (!authLoading && user)) {
    return null;
  }

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Please enter your full name (at least 2 characters).";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must include at least one uppercase letter.";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must include at least one number.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name.trim(),
        role: "user",
        created_at: new Date(),
      });

      document.cookie = `userRole=user; path=/; max-age=86400; SameSite=Strict`;
      router.push("/dashboard");
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0f1c] text-gray-900 dark:text-white relative overflow-hidden font-sans transition-colors duration-500 px-4 py-10">
      {/* Background glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-amber-400/5 dark:bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand */}
      <div className="mb-8 relative z-10 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-xl">
          <i className="las la-chart-bar text-2xl text-white dark:text-gray-900"></i>
        </div>
        <h1 className="text-2xl font-black tracking-tighter">
          GFT<span className="text-indigo-600 dark:text-indigo-400">Journal</span>
        </h1>
      </div>

      <div className="bg-white/90 dark:bg-[#111318]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full max-w-[440px] border border-gray-100 dark:border-slate-800/50 relative z-10">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">Create Account</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Start tracking your trades with GFT Journal</p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3">
            <i className="las la-exclamation-circle text-xl mt-0.5 shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
            <div className="relative group">
              <i className="las la-user absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: "" })); }}
                className={`w-full bg-gray-50 dark:bg-[#16181d] border rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600 ${fieldErrors.name ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10" : "border-gray-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-indigo-500/10"}`}
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>
            {fieldErrors.name && <p className="text-xs text-rose-500 dark:text-rose-400 pl-1 font-semibold">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative group">
              <i className="las la-envelope absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
                className={`w-full bg-gray-50 dark:bg-[#16181d] border rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600 ${fieldErrors.email ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10" : "border-gray-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-indigo-500/10"}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-rose-500 dark:text-rose-400 pl-1 font-semibold">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Password</label>
            <div className="relative group">
              <i className="las la-lock absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                className={`w-full bg-gray-50 dark:bg-[#16181d] border rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-4 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600 ${fieldErrors.password ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10" : "border-gray-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-indigo-500/10"}`}
                placeholder="Min 8 characters"
                autoComplete="new-password"
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
            {/* Password strength bar */}
            {password && passwordStrength && (
              <div className="space-y-1 px-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? passwordStrength.color : "bg-gray-200 dark:bg-slate-700"}`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] font-bold ${passwordStrength.score <= 2 ? "text-rose-500" : passwordStrength.score === 3 ? "text-yellow-500" : "text-emerald-500"}`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {fieldErrors.password && <p className="text-xs text-rose-500 dark:text-rose-400 pl-1 font-semibold">{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
            <div className="relative group">
              <i className="las la-shield-alt absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none"></i>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: "" })); }}
                className={`w-full bg-gray-50 dark:bg-[#16181d] border rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-4 text-gray-900 dark:text-white transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-600 ${fieldErrors.confirmPassword ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10" : "border-gray-200 dark:border-slate-700/50 focus:border-indigo-500 focus:ring-indigo-500/10"}`}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-indigo-500 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <i className={`las ${showConfirmPassword ? "la-eye-slash" : "la-eye"} text-xl`}></i>
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="text-xs text-rose-500 dark:text-rose-400 pl-1 font-semibold">{fieldErrors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            id="register-submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black py-4 px-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><i className="las la-spinner la-spin text-xl"></i> Creating Account...</>
            ) : (
              <><i className="las la-user-plus text-xl"></i> Create Account</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-semibold text-gray-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-black transition-colors underline decoration-2 underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
